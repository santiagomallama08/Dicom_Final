# api/routers/historial_router.py

from fastapi import APIRouter
from typing import List
from api.models.schemas import ArchivoDicomOut
from api.services.historial_services import obtener_historial_archivos

router = APIRouter()


@router.get("/historial/archivos", response_model=List[ArchivoDicomOut])
def listar_historial_archivos():
    return obtener_historial_archivos()
