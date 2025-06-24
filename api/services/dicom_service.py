import json
import os
import io
import uuid
import zipfile
from typing import List
from skimage import exposure
import pydicom
from PIL import Image
import numpy as np


def convert_dicom_zip_to_png_paths(zip_file: bytes) -> dict:
    session_id = str(uuid.uuid4())
    output_dir = os.path.join("api", "static", "series", session_id)
    os.makedirs(output_dir, exist_ok=True)

    dicom_mapping = {}
    image_paths = []

    with zipfile.ZipFile(io.BytesIO(zip_file)) as archive:
        dcm_files = [f for f in archive.namelist() if f.lower().endswith(".dcm")]

        if not dcm_files:
            raise ValueError("No se encontraron archivos DICOM en el ZIP.")

        for idx, dicom_name in enumerate(dcm_files):
            try:
                # Leer bytes del archivo .dcm dentro del ZIP
                with archive.open(dicom_name) as file:
                    dicom_bytes = file.read()

                # ✅ Guardar físicamente el archivo DICOM con su ruta original
                dicom_output_path = os.path.join(output_dir, dicom_name)
                os.makedirs(os.path.dirname(dicom_output_path), exist_ok=True)
                with open(dicom_output_path, "wb") as f:
                    f.write(dicom_bytes)

                # Leer el DICOM desde memoria
                ds = pydicom.dcmread(io.BytesIO(dicom_bytes), force=True)

                # Verificar que tiene imagen
                if "PixelData" not in ds:
                    continue

                # Generar imagen PNG
                image = ds.pixel_array
                image = exposure.equalize_adapthist(image)
                image = (image * 255).astype("uint8")
                im = Image.fromarray(image).convert("L")

                # Guardar PNG
                png_filename = f"image_{idx}.png"
                png_path = os.path.join(output_dir, png_filename)
                im.save(png_path)

                # Registrar mapeo entre PNG y ruta relativa del DICOM
                dicom_mapping[png_filename] = dicom_name
                image_paths.append(f"/static/series/{session_id}/{png_filename}")

            except Exception as e:
                print(f"⚠️ Error procesando {dicom_name}: {e}")
                continue

    if not image_paths:
        raise ValueError("No se pudieron procesar archivos DICOM válidos.")

    # Guardar archivo de mapeo
    mapping_path = os.path.join(output_dir, "mapping.json")
    with open(mapping_path, "w", encoding="utf-8") as f:
        json.dump(dicom_mapping, f, ensure_ascii=False, indent=2)

    return {
        "message": "ZIP procesado correctamente",
        "session_id": session_id,
        "image_series": image_paths,
        "mapping_url": f"/static/series/{session_id}/mapping.json"
    }
