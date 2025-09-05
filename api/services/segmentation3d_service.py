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

    # recolectar DICOMs reales de la serie
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

    # armar info para ordenar
    enriched = []
    for p in entries:
        ds = pydicom.dcmread(p, force=True, stop_before_pixels=True)
        # modalidad
        modality = getattr(ds, "Modality", "").upper()
        # z preferido
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

    # ordenar: primero por z si existe, si no por InstanceNumber, si no por nombre
    def _sort_key(t):
        p, modality, z, inst = t
        if z is not None:
            return (0, z)
        if inst is not None:
            return (1, inst)
        return (2, os.path.basename(p))

    enriched.sort(key=_sort_key)

    # cargar pixeles (ordenados)
    slices = []
    for p, modality, _, _ in enriched:
        ds = pydicom.dcmread(p, force=True)
        arr = ds.pixel_array.astype(np.float32)
        # guardar spacing del primer corte válido
        slices.append((arr, ds))

    if not slices:
        raise ValueError("No se pudieron leer los pixeles DICOM")

    # spacing desde el primer corte
    ds0 = slices[0][1]
    try:
        px_y, px_x = [float(v) for v in ds0.PixelSpacing]
    except Exception:
        px_y, px_x = 1.0, 1.0
    slice_thk = float(getattr(ds0, "SliceThickness", 1.0))
    spacing = (slice_thk, px_y, px_x)  # (z, y, x) en mm

    vol = np.stack([s[0] for s in slices], axis=0)  # (Z,Y,X)
    modality0 = getattr(ds0, "Modality", "").upper()

    # HU si CT (si hay slope/intercept)
    if modality0 == "CT":
        slope = float(getattr(ds0, "RescaleSlope", 1.0))
        intercept = float(getattr(ds0, "RescaleIntercept", 0.0))
        vol = vol * slope + intercept  # ahora en HU

    return vol, spacing, modality0


def segmentar_serie_3d(session_id: str, user_id: int) -> dict:
    vol, spacing, modality = _load_stack(session_id)  # vol: (Z,Y,X)
    os.makedirs(_seg3d_dir(session_id), exist_ok=True)

    # ====== UMBRAL ======
    if modality == "CT":
        thr = 300.0
        mask = vol > thr
    else:
        vpos = vol[vol > 0]
        if vpos.size >= 1024:
            try:
                thr = float(threshold_otsu(vpos.astype(np.float32)))
                mask = vol > thr
            except Exception:
                thr = float(np.percentile(vpos, 95.0))
                mask = vol > thr
        else:
            thr = float(np.percentile(vol, 95.0))
            mask = vol > thr

    mask = binary_closing(mask, footprint=ball(1))
    mask = morphology.remove_small_objects(mask, min_size=2000)

    labels = measure.label(mask, connectivity=3)
    if labels.max() > 0:
        counts = np.bincount(labels.ravel())
        largest = int(np.argmax(counts[1:]) + 1)
        mask = labels == largest
    else:
        mask = np.zeros_like(mask, dtype=bool)

    voxel_mm3 = float(spacing[0] * spacing[1] * spacing[2])
    voxels = int(mask.sum())
    volume_mm3 = float(voxels * voxel_mm3)

    # ====== nombres únicos por segmentación ======
    base_out = _seg3d_dir(session_id)
    uid = f"{int(time.time()*1e6)}_{uuid.uuid4().hex[:8]}"

    def _pub(name):  # ruta pública
        return f"/static/segmentations3d/{session_id}/{name}"

    mask_name = f"{uid}_mask.npy"
    ax_name   = f"{uid}_axial.png"
    sg_name   = f"{uid}_sagittal.png"
    cr_name   = f"{uid}_coronal.png"

    zc, yc, xc = mask.shape[0] // 2, mask.shape[1] // 2, mask.shape[2] // 2
    np.save(os.path.join(base_out, mask_name), mask.astype(np.uint8))
    io.imsave(os.path.join(base_out, ax_name), (mask[zc].astype(np.uint8) * 255))
    io.imsave(os.path.join(base_out, sg_name), (mask[:, :, xc].astype(np.uint8) * 255))
    io.imsave(os.path.join(base_out, cr_name), (mask[:, yc].astype(np.uint8) * 255))

    if voxels == 0:
        # NO persistimos en DB si quedó vacía (pero dejamos thumbs únicas)
        return {
            "message": "Segmentación vacía (umbral no encontró estructura).",
            "volume_mm3": 0.0,
            "surface_mm2": None,
            "thumbs": {"axial": _pub(ax_name), "sagittal": _pub(sg_name), "coronal": _pub(cr_name)},
            "warning": True,
        }

    # ====== métricas superficie y bbox ======
    coords = np.argwhere(mask)
    zmin, ymin, xmin = coords.min(axis=0)
    zmax, ymax, xmax = coords.max(axis=0)
    bbox_z_mm = float((zmax - zmin + 1) * spacing[0])
    bbox_y_mm = float((ymax - ymin + 1) * spacing[1])
    bbox_x_mm = float((xmax - xmin + 1) * spacing[2])

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

    # ====== guardar en DB SI hay voxels, SIEMPRE con parámetros ======
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
