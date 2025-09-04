# api/services/segmentation3d_service.py
import os
import json
import numpy as np
import pydicom
from skimage import measure, morphology, io
from config.db_config import get_connection


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

    # Reunir DICOMs desde el mapping
    entries = []
    for _, meta in mapping.items():
        dcm_name = meta.get("dicom_name")
        if not dcm_name:
            continue
        dcm_path = os.path.join(base, dcm_name)
        if os.path.isfile(dcm_path):
            entries.append(dcm_path)

    if not entries:
        raise ValueError("No se encontraron DICOM válidos en la serie")

    # Cargar cortes y posiciones Z
    slices, z_positions = [], []
    for p in entries:
        ds = pydicom.dcmread(p, force=True)
        slices.append(ds.pixel_array.astype(np.int16))
        z = float(
            getattr(
                ds, "ImagePositionPatient", [0, 0, getattr(ds, "SliceLocation", 0)]
            )[2]
        )
        z_positions.append(z)

    # Ordenar por Z
    order = np.argsort(z_positions)
    stack = np.stack([slices[i] for i in order], axis=0)

    # Pixel spacing (y, x) desde el primer corte ordenado
    ds0 = pydicom.dcmread(entries[order[0]], force=True)
    if hasattr(ds0, "PixelSpacing"):
        px_y, px_x = float(ds0.PixelSpacing[0]), float(ds0.PixelSpacing[1])
    else:
        px_y, px_x = 1.0, 1.0

    # >>> NUEVO: dz a partir de las posiciones Z reales (fallback a SliceThickness)
    sorted_z = np.array(sorted(z_positions))
    if len(sorted_z) >= 2:
        dz_est = float(np.median(np.diff(sorted_z)))
    else:
        dz_est = float(getattr(ds0, "SliceThickness", 1.0))

    spacing = (abs(dz_est), px_y, px_x)  # (z, y, x) en mm

    return stack, spacing


def segmentar_serie_3d(session_id: str, user_id: int) -> dict:
    vol, spacing = _load_stack(session_id)  # (Z, Y, X)
    os.makedirs(_seg3d_dir(session_id), exist_ok=True)

    # Umbral simple (igual filosofía que tu 2D)
    mask = vol > 400
    mask = morphology.remove_small_objects(mask, min_size=500)

    # Mantener mayor componente conectado 3D (si lo deseas)
    labels = measure.label(mask, connectivity=1)
    if labels.max() > 0:
        # elegir componente con mayor voxels
        largest = np.argmax(np.bincount(labels.flat)[1:]) + 1
        mask = labels == largest
    else:
        mask = np.zeros_like(mask, dtype=bool)

    # Métricas volumétricas
    voxel_mm3 = spacing[0] * spacing[1] * spacing[2]
    voxels = int(mask.sum())
    volume_mm3 = float(voxels * voxel_mm3)

    # BBox en mm
    coords = np.argwhere(mask)
    if coords.size > 0:
        zmin, ymin, xmin = coords.min(axis=0)
        zmax, ymax, xmax = coords.max(axis=0)
        bbox_z_mm = (zmax - zmin + 1) * spacing[0]
        bbox_y_mm = (ymax - ymin + 1) * spacing[1]
        bbox_x_mm = (xmax - xmin + 1) * spacing[2]
    else:
        bbox_x_mm = bbox_y_mm = bbox_z_mm = 0.0

    # Superficie aproximada (opcional): marching cubes sobre máscara
    surface_mm2 = None
    try:
        verts, faces, _, _ = measure.marching_cubes(
            mask.astype(np.uint8), level=0.5, spacing=spacing[::-1]
        )  # spacing en (x,y,z)
        # área de malla
        tri_verts = verts[faces]
        v1 = tri_verts[:, 1, :] - tri_verts[:, 0, :]
        v2 = tri_verts[:, 2, :] - tri_verts[:, 0, :]
        cross = np.linalg.norm(np.cross(v1, v2), axis=1)
        surface_mm2 = float(np.sum(0.5 * cross))
    except Exception:
        surface_mm2 = None

    # Guardados
    base_out = _seg3d_dir(session_id)
    npy_path_abs = os.path.join(base_out, "mask.npy")
    np.save(npy_path_abs, mask.astype(np.uint8))

    # Thumbnails cortes medios
    zc = mask.shape[0] // 2
    yc = mask.shape[1] // 2
    xc = mask.shape[2] // 2

    axial_png_abs = os.path.join(base_out, "axial.png")  # corte en Z
    sagittal_png_abs = os.path.join(base_out, "sagittal.png")  # corte en X
    coronal_png_abs = os.path.join(base_out, "coronal.png")  # corte en Y

    io.imsave(axial_png_abs, (mask[zc, :, :].astype(np.uint8) * 255))
    io.imsave(sagittal_png_abs, (mask[:, :, xc].astype(np.uint8) * 255))
    io.imsave(coronal_png_abs, (mask[:, yc, :].astype(np.uint8) * 255))

    # Rutas públicas
    public_base = f"/static/segmentations3d/{session_id}"
    npy_pub = f"{public_base}/mask.npy"
    axial_pub = f"{public_base}/axial.png"
    sag_pub = f"{public_base}/sagittal.png"
    cor_pub = f"{public_base}/coronal.png"

    # --- antes del INSERT:
    volume_mm3 = float(volume_mm3)
    surface_mm2 = float(surface_mm2) if surface_mm2 is not None else None
    bbox_x_mm = float(bbox_x_mm)
    bbox_y_mm = float(bbox_y_mm)
    bbox_z_mm = float(bbox_z_mm)

    # Persistir en DB
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
            volume_mm3,
            surface_mm2,
            bbox_x_mm,
            bbox_y_mm,
            bbox_z_mm,
            npy_pub,
            axial_pub,
            sag_pub,
            cor_pub,
        ),
    )
    seg3d_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()

    return {
        "message": "Segmentación 3D creada",
        "seg3d_id": seg3d_id,
        "volume_mm3": volume_mm3,
        "surface_mm2": surface_mm2,
        "thumbs": {"axial": axial_pub, "sagittal": sag_pub, "coronal": cor_pub},
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
