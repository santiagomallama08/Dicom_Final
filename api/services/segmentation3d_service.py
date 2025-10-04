# api/services/segmentation3d_service.py
import os
import json
import time
import uuid
import numpy as np
import pydicom
from skimage import measure, morphology, io
from config.db_config import get_connection
from skimage.filters import threshold_otsu
from skimage.morphology import binary_closing, ball
from typing import Optional, Tuple
from scipy.ndimage import binary_fill_holes, median_filter
# from skimage.morphology import ellipsoid

def _serie_dir(session_id: str):
    return os.path.abspath(os.path.join("api", "static", "series", session_id))


def _seg3d_dir(session_id: str):
    return os.path.abspath(os.path.join("api", "static", "segmentations3d", session_id))


def _load_stack(session_id: str):
    base = _serie_dir(session_id)
    mapping_path = os.path.join(base, "mapping.json")
    if not os.path.isfile(mapping_path):
        raise FileNotFoundError("mapping.json no encontrado para la serie")

    with open(mapping_path, "r", encoding="utf-8") as f:
        mapping = json.load(f)

    entries = []
    for _, meta in mapping.items():
        dcm_name = meta.get("dicom_name")
        if not dcm_name:
            continue
        p = os.path.join(base, dcm_name)
        if os.path.isfile(p):
            entries.append(p)
    if not entries:
        raise ValueError("No se encontraron DICOM válidos en la serie")

    enriched = []
    for p in entries:
        ds = pydicom.dcmread(p, force=True, stop_before_pixels=True)
        modality = str(getattr(ds, "Modality", "")).upper()

        z = None
        ipp = getattr(ds, "ImagePositionPatient", None)
        if isinstance(ipp, (list, tuple)) and len(ipp) == 3:
            try:
                z = float(ipp[2])
            except Exception:
                z = None

        inst = getattr(ds, "InstanceNumber", None)
        inst = int(inst) if inst is not None else None
        enriched.append((p, modality, z, inst))

    def _sort_key(t):
        p, modality, z, inst = t
        if z is not None:
            return (0, z)
        if inst is not None:
            return (1, inst)
        return (2, os.path.basename(p))

    enriched.sort(key=_sort_key)

    slices = []
    z_values = []
    for p, modality, z, _ in enriched:
        ds = pydicom.dcmread(p, force=True)
        arr = ds.pixel_array.astype(np.float32)
        slices.append((arr, ds))
        if z is not None:
            z_values.append(z)

    if not slices:
        raise ValueError("No se pudieron leer los pixeles DICOM")

    ds0 = slices[0][1]
    # Pixel spacing (Y, X)
    px_y, px_x = 1.0, 1.0
    try:
        if hasattr(ds0, "PixelSpacing"):
            px_y, px_x = [float(v) for v in ds0.PixelSpacing]
        elif hasattr(ds0, "ImagerPixelSpacing"):
            px_y, px_x = [float(v) for v in ds0.ImagerPixelSpacing]
    except Exception:
        pass

    # Slice spacing (Z): robusto
    slice_thk = None
    try:
        slice_thk = float(getattr(ds0, "SliceThickness", None))
    except Exception:
        slice_thk = None

    dz = None
    if len(z_values) >= 2:
        z_sorted = np.sort(np.array(z_values, dtype=np.float64))
        diffs = np.diff(z_sorted)
        diffs = diffs[np.isfinite(diffs) & (np.abs(diffs) > 1e-6)]
        if diffs.size > 0:
            dz = float(np.median(np.abs(diffs)))
    if dz is None:
        # fallback razonables
        sbs = getattr(ds0, "SpacingBetweenSlices", None)
        if sbs is not None:
            try:
                dz = float(sbs)
            except Exception:
                dz = None
    if dz is None and slice_thk is not None:
        dz = float(slice_thk)
    if dz is None or dz <= 0:
        dz = 1.0  # último recurso

    spacing = (dz, float(px_y), float(px_x))  # (Z,Y,X) en mm
    vol = np.stack([s[0] for s in slices], axis=0)  # (Z,Y,X)

    modality0 = str(getattr(ds0, "Modality", "")).upper()
    # Normalización a HU para CT
    if modality0 == "CT":
        slope = float(getattr(ds0, "RescaleSlope", 1.0))
        intercept = float(getattr(ds0, "RescaleIntercept", 0.0))
        vol = vol * slope + intercept  # HU

        # Recorte suave para evitar extremos locos
        vol = np.clip(vol, -1024, 4000)

    return vol, spacing, modality0


def segmentar_serie_3d(
    session_id: str,
    user_id: int,
    preset: Optional[str] = None,
    thr_min: Optional[float] = None,
    thr_max: Optional[float] = None,
    min_size_voxels: int = 2000,
    close_radius_mm: float = 1.5,
) -> dict:
    """
    Segmentación 3D robusta con presets por modalidad.
      - CT: umbrales en HU (ej: hueso)
      - MR: Otsu + robustez
    """
    vol, spacing, modality = _load_stack(session_id)  # (Z,Y,X)
    os.makedirs(_seg3d_dir(session_id), exist_ok=True)

    # ===== 1) Pre-procesado suave (reduce ruido sal y pimienta) =====
    # Solo si el volumen es razonable en tamaño
    if vol.size > 2_000_000:
        try:
            vol = median_filter(vol, size=3)
        except Exception:
            pass

    # ===== 2) Binarización según modalidad/preset =====
    mask = None

    if modality == "CT":
        # Presets típicos en HU
        presets = {
            "ct_bone": (150.0, 4000.0),
            "ct_soft": (-300.0, 300.0),
            "ct_lung": (-1000.0, -300.0),
        }
        if preset in presets:
            tmin, tmax = presets[preset]
            mask = (vol >= tmin) & (vol <= tmax)
        elif thr_min is not None or thr_max is not None:
            tmin = thr_min if thr_min is not None else np.percentile(vol, 60)
            tmax = thr_max if thr_max is not None else np.max(vol)
            mask = (vol >= tmin) & (vol <= tmax)
        else:
            # Fallback razonable para hueso
            mask = vol > 150.0

    else:
        # MR: normaliza (percentiles) y Otsu global
        v = vol[np.isfinite(vol)]
        if v.size == 0:
            mask = np.zeros_like(vol, dtype=bool)
        else:
            lo, hi = np.percentile(v, [2, 98])
            if hi <= lo:
                hi = lo + 1.0
            vclip = np.clip(vol, lo, hi)
            vclip = (vclip - lo) / (hi - lo + 1e-6)
            try:
                thr = float(threshold_otsu(vclip[vclip > 0]))
                mask = vclip > thr
            except Exception:
                # último recurso: percentil alto
                thr = float(np.percentile(vclip, 95))
                mask = vclip > thr

    # ===== 3) Morfología 3D =====
    # Cierre anisotrópico en mm
    r_vox = max(1, int(round(close_radius_mm / max(float(np.mean(spacing)), 1e-6))))
    mask = binary_closing(mask, footprint=ball(r_vox))
    # Rellena huecos internos (3D)
    try:
        mask = binary_fill_holes(mask)
    except Exception:
        pass

    # Limpieza de partículas pequeñas
    mask = morphology.remove_small_objects(mask, min_size=int(min_size_voxels))

    # Mantener componente conexa más grande
    labels = measure.label(mask, connectivity=3)
    if labels.max() > 0:
        counts = np.bincount(labels.ravel())
        largest = int(np.argmax(counts[1:]) + 1)
        mask = labels == largest
    else:
        mask = np.zeros_like(mask, dtype=bool)

    # ===== 4) Métricas =====
    voxel_mm3 = float(spacing[0] * spacing[1] * spacing[2])
    voxels = int(mask.sum())
    volume_mm3 = float(voxels * voxel_mm3)

    # ===== nombres únicos por segmentación =====
    base_out = _seg3d_dir(session_id)
    uid = f"{int(time.time()*1e6)}_{uuid.uuid4().hex[:8]}"

    def _pub(name):
        return f"/static/segmentations3d/{session_id}/{name}"

    mask_name = f"{uid}_mask.npy"
    ax_name   = f"{uid}_axial.png"
    sg_name   = f"{uid}_sagittal.png"
    cr_name   = f"{uid}_coronal.png"

    zc, yc, xc = mask.shape[0] // 2, mask.shape[1] // 2, mask.shape[2] // 2
    np.save(os.path.join(base_out, mask_name), mask.astype(np.uint8))

    # thumbs (255/0 para evitar “low contrast”)
    io.imsave(os.path.join(base_out, ax_name), (mask[zc].astype(np.uint8) * 255))
    io.imsave(os.path.join(base_out, sg_name), (mask[:, :, xc].astype(np.uint8) * 255))
    io.imsave(os.path.join(base_out, cr_name), (mask[:, yc].astype(np.uint8) * 255))

    if voxels == 0:
        return {
            "message": "Segmentación vacía (ajusta preset/umbral).",
            "volume_mm3": 0.0,
            "surface_mm2": None,
            "thumbs": {"axial": _pub(ax_name), "sagittal": _pub(sg_name), "coronal": _pub(cr_name)},
            "warning": True,
            "modality": modality,
            "spacing_mm": {"z": spacing[0], "y": spacing[1], "x": spacing[2]},
        }

    # bbox físico
    coords = np.argwhere(mask)
    zmin, ymin, xmin = coords.min(axis=0)
    zmax, ymax, xmax = coords.max(axis=0)
    bbox_z_mm = float((zmax - zmin + 1) * spacing[0])
    bbox_y_mm = float((ymax - ymin + 1) * spacing[1])
    bbox_x_mm = float((xmax - xmin + 1) * spacing[2])

    # Superficie
    surface_mm2 = None
    try:
        verts, faces, _, _ = measure.marching_cubes(
            mask.astype(np.uint8), level=0.5, spacing=tuple(spacing[::-1])
        )
        tri_verts = verts[faces]
        v1 = tri_verts[:, 1, :] - tri_verts[:, 0, :]
        v2 = tri_verts[:, 2, :] - tri_verts[:, 0, :]
        cross = np.linalg.norm(np.cross(v1, v2), axis=1)
        surface_mm2 = float(np.sum(0.5 * cross))
    except Exception:
        surface_mm2 = None

    # Guardar en DB si hay voxels
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO segmentacion3d
          (session_id, user_id, n_slices, volume_mm3, surface_mm2,
           bbox_x_mm, bbox_y_mm, bbox_z_mm, mask_npy_path,
           thumb_axial, thumb_sagittal, thumb_coronal)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id
        """,
        (
            session_id,
            int(user_id),
            int(mask.shape[0]),
            float(volume_mm3),
            (float(surface_mm2) if surface_mm2 is not None else None),
            float(bbox_x_mm),
            float(bbox_y_mm),
            float(bbox_z_mm),
            _pub(mask_name),
            _pub(ax_name),
            _pub(sg_name),
            _pub(cr_name),
        ),
    )
    seg3d_id = int(cur.fetchone()[0])
    conn.commit()
    cur.close()
    conn.close()

    return {
        "message": "Segmentación 3D creada",
        "seg3d_id": seg3d_id,
        "volume_mm3": float(volume_mm3),
        "surface_mm2": (float(surface_mm2) if surface_mm2 is not None else None),
        "thumbs": {"axial": _pub(ax_name), "sagittal": _pub(sg_name), "coronal": _pub(cr_name)},
        "bbox": {"x_mm": float(bbox_x_mm), "y_mm": float(bbox_y_mm), "z_mm": float(bbox_z_mm)},
        "n_slices": int(mask.shape[0]),
        "modality": modality,
        "spacing_mm": {"z": spacing[0], "y": spacing[1], "x": spacing[2]},
    }


def listar_segmentaciones_3d(session_id: str, user_id: int):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT id, n_slices, volume_mm3, surface_mm2,
               bbox_x_mm, bbox_y_mm, bbox_z_mm,
               mask_npy_path, thumb_axial, thumb_sagittal, thumb_coronal, created_at
        FROM segmentacion3d
        WHERE session_id = %s AND user_id = %s
        ORDER BY created_at DESC
        """,
        (session_id, user_id),
    )
    rows = cur.fetchall()
    cur.close()
    conn.close()

    out = []
    for r in rows:
        out.append(
            {
                "id": r[0],
                "n_slices": r[1],
                "volume_mm3": float(r[2]),
                "surface_mm2": (float(r[3]) if r[3] is not None else None),
                "bbox_x_mm": float(r[4]),
                "bbox_y_mm": float(r[5]),
                "bbox_z_mm": float(r[6]),
                "mask_npy_path": r[7],
                "thumb_axial": r[8],
                "thumb_sagittal": r[9],
                "thumb_coronal": r[10],
                "created_at": r[11].isoformat() if r[11] else None,
            }
        )
    return out


def borrar_segmentacion_3d(seg3d_id: int, user_id: int) -> bool:
    # También intentamos borrar archivos asociados
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "SELECT session_id, mask_npy_path, thumb_axial, thumb_sagittal, thumb_coronal FROM segmentacion3d WHERE id = %s AND user_id = %s",
        (seg3d_id, user_id),
    )
    row = cur.fetchone()
    if not row:
        cur.close()
        conn.close()
        return False

    session_id, npy_pub, ax_pub, sg_pub, cr_pub = row
    base = _seg3d_dir(session_id)

    # Borrar registro
    cur.execute(
        "DELETE FROM segmentacion3d WHERE id = %s AND user_id = %s", (seg3d_id, user_id)
    )
    conn.commit()
    cur.close()
    conn.close()

    # Borrar archivos si existen
    def rm(pub_path):
        if not pub_path:
            return
        fname = os.path.basename(pub_path)
        p = os.path.join(base, fname)
        if os.path.isfile(p):
            try:
                os.remove(p)
            except:
                pass

    rm(npy_pub)
    rm(ax_pub)
    rm(sg_pub)
    rm(cr_pub)

    # Si la carpeta queda vacía, puedes opcionalmente eliminarla
    try:
        if os.path.isdir(base) and not os.listdir(base):
            os.rmdir(base)
    except:
        pass

    return True

# def _ellipsoid_mm(radius_mm: float, spacing: Tuple[float, float, float]) -> np.ndarray:
#     """
#     Devuelve un elemento estructurante elipsoidal 3D en voxeles a partir de un radio en mm.
#     """
#     rz = max(1, int(round(radius_mm / max(spacing[0], 1e-6))))
#     ry = max(1, int(round(radius_mm / max(spacing[1], 1e-6))))
#     rx = max(1, int(round(radius_mm / max(spacing[2], 1e-6))))
#     return ellipsoid(rx, ry, rz)  