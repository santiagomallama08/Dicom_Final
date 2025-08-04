# api/routers/historial_router.py

from fastapi import APIRouter, HTTPException
from typing import List
from api.models.schemas import ArchivoDicomOut
from api.services.historial_services import obtener_historial_archivos
from api.services.historial_services import eliminar_serie_por_session_id

router = APIRouter()


@router.get("/historial/archivos", response_model=List[ArchivoDicomOut])
def listar_historial_archivos():
    return obtener_historial_archivos()


@router.delete("/historial/series/{session_id}")
def eliminar_serie(session_id: str):
    try:
        eliminar_serie_por_session_id(session_id)
        return {"mensaje": "Serie eliminada correctamente."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
