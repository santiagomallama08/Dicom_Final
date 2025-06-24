import tempfile
from tkinter import Image
import uuid
import zipfile
from fastapi import APIRouter, Form, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse
import os
import numpy as np
import pydicom
from fastapi import Query
import json


from ..services.dicom_service import convert_dicom_zip_to_png_paths

router = APIRouter()


@router.post("/upload-dicom")
async def upload_dicom(file: UploadFile = File(...)):
    try:
        # Guardar temporalmente el archivo
        contents = await file.read()
        temp_path = f"temp_{file.filename}"
        with open(temp_path, "wb") as f:
            f.write(contents)

        # Leer el archivo con pydicom
        dicom = pydicom.dcmread(temp_path)

        # Extraer metadatos
        metadata = {
            "PatientID": dicom.get("PatientID", "N/A"),
            "StudyDate": dicom.get("StudyDate", "N/A"),
            "Modality": dicom.get("Modality", "N/A"),
            "Rows": dicom.get("Rows", "N/A"),
            "Columns": dicom.get("Columns", "N/A"),
            "NumberOfFrames": dicom.get("NumberOfFrames", "1"),
            "SOPInstanceUID": dicom.get("SOPInstanceUID", "N/A"),
        }

        # Borrar archivo temporal
        os.remove(temp_path)

        # Devolver metadatos
        return JSONResponse(
            content={
                "message": "Archivo DICOM subido y procesado exitosamente.",
                "metadata": metadata,
            }
        )

    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)


@router.post("/upload-dicom-series/")
async def upload_dicom_series(file: UploadFile = File(...)):
    if not file.filename.endswith(".zip"):
        raise HTTPException(
            status_code=400, detail="Debe subir un archivo .zip con archivos DICOM"
        )

    try:
        zip_bytes = await file.read()
        image_paths = convert_dicom_zip_to_png_paths(zip_bytes)
        return JSONResponse(
            content={
                "message": f"{len(image_paths)} imágenes convertidas correctamente.",
                "image_series": image_paths,
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/segmentar-dicom/")
async def segmentar_dicom_endpoint(file: UploadFile = File(...)):
    try:
        # Guardar DICOM temporalmente
        contents = await file.read()
        temp_dir = tempfile.mkdtemp()
        dicom_path = os.path.join(temp_dir, file.filename)

        with open(dicom_path, "wb") as f:
            f.write(contents)

        # Llamar servicio
        from ..services.segmentation_services import segmentar_dicom

        resultado = segmentar_dicom(dicom_path)

        return resultado

    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)


@router.get("/series-mapping/")
def obtener_mapping_de_serie(
    session_id: str = Query(..., description="UUID de la serie cargada")
):
    try:
        mapping_path = os.path.join("static", "series", session_id, "mapping.json")
        if not os.path.exists(mapping_path):
            return JSONResponse(
                content={"error": "No se encontró el archivo de mapeo"}, status_code=404
            )

        with open(mapping_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            return {"mapping": data}

    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)


@router.post("/segmentar-desde-mapping/")
async def segmentar_desde_mapping(
    session_id: str = Form(...), image_name: str = Form(...)
):
    try:
        # Ruta a la carpeta de la sesión
        base_dir = os.path.join("api", "static", "series", session_id)
        mapping_path = os.path.join(base_dir, "mapping.json")

        if not os.path.exists(mapping_path):
            raise FileNotFoundError("No se encontró el archivo mapping.json")

        with open(mapping_path, "r") as f:
            mapping = json.load(f)

        if image_name not in mapping:
            raise ValueError(f"No se encontró {image_name} en el mapping")

        dicom_relative_path = mapping[image_name]

        # ✅ CORRECCIÓN: para manejar rutas como series-00001/image-00010.dcm
        dicom_path = os.path.join(base_dir, *dicom_relative_path.split("/"))

        if not os.path.exists(dicom_path):
            raise FileNotFoundError(
                f"No se encontró el archivo DICOM: {dicom_relative_path}"
            )

        # Importar servicio de segmentación
        from ..services.segmentation_services import segmentar_dicom

        resultado = segmentar_dicom(dicom_path)

        return resultado

    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)
