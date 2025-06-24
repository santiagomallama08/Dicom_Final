import os
import numpy as np
import pydicom
from skimage import measure, morphology, io
from skimage.measure import regionprops
from uuid import uuid4

def segmentar_dicom(dicom_path: str, output_dir: str = "static/segmentations") -> dict:
    try:
        os.makedirs(output_dir, exist_ok=True)
        base = os.path.splitext(os.path.basename(dicom_path))[0]
        output_file = os.path.join(output_dir, f"{base}_mask.png")

        # Leer imagen DICOM
        ds = pydicom.dcmread(dicom_path)
        imagen = ds.pixel_array.astype(np.int16)

        # Segmentación simple por umbral
        umbral = 400  # adaptable en el futuro
        mascara = imagen > umbral
        mascara = morphology.remove_small_objects(mascara, min_size=500)

        etiquetas = measure.label(mascara)
        props = regionprops(etiquetas)

        if props:
            lbl = max(props, key=lambda r: r.area).label
            segmento = etiquetas == lbl
        else:
            segmento = np.zeros_like(imagen)

        binaria = (segmento.astype(np.uint8) * 255)
        io.imsave(output_file, binaria)

        # Medidas físicas
        px_y, px_x = ds.PixelSpacing
        slice_thk = getattr(ds, "SliceThickness", 1.0)

        if props:
            r = max(props, key=lambda r: r.area)
            minr, minc, maxr, maxc = r.bbox
            largo_px = maxr - minr
            ancho_px = maxc - minc
            area_px = r.area
            perim_px = r.perimeter

            dimensiones = {
                "Longitud (mm)": round(largo_px * px_y, 2),
                "Ancho (mm)":    round(ancho_px * px_x, 2),
                "Altura (mm)":   round(slice_thk, 2),
                "Área (mm²)":    round(area_px * px_x * px_y, 2),
                "Perímetro (px)": round(perim_px, 2),
                "Volumen (mm³)": round(area_px * px_x * px_y * slice_thk, 2)
            }
        else:
            dimensiones = {"error": "No se detectó región válida."}

        return {
            "mensaje": "Segmentación exitosa",
            "mask_path": f"/{output_file.replace(os.sep, '/')}",
            "dimensiones": dimensiones
        }

    except Exception as e:
        return {"error": str(e)}