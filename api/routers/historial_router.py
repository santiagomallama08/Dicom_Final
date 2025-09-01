# api/routers/historial_router.py
from fastapi import APIRouter, HTTPException, Header
from typing import List
from api.models.schemas import ArchivoDicomOut
from api.services.historial_services import (
    obtener_historial_archivos,
    eliminar_serie_por_session_id,
    listar_segmentaciones_por_session_id,
    eliminar_segmentacion_por_archivo,
)

router = APIRouter()


@router.get("/historial/series/{session_id}/segmentaciones")
def listar_segmentaciones(
    session_id: str, x_user_id: int = Header(..., alias="X-User-Id")
):
    try:
        return listar_segmentaciones_por_session_id(session_id, user_id=x_user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/historial/series/{session_id}/segmentaciones/{archivodicomid}")
def eliminar_segmentacion(
    session_id: str,
    archivodicomid: int,
    x_user_id: int = Header(..., alias="X-User-Id"),
):
    try:
        ok = eliminar_segmentacion_por_archivo(
            session_id, archivodicomid, user_id=x_user_id
        )
        if not ok:
            raise HTTPException(
                status_code=500, detail="No se pudo eliminar la segmentación."
            )
        return {"mensaje": "Segmentación eliminada."}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/historial/archivos")
def listar_historial_archivos(x_user_id: int = Header(..., alias="X-User-Id")):
    return obtener_historial_archivos(user_id=x_user_id)


@router.delete("/historial/series/{session_id}")
def eliminar_serie(session_id: str, x_user_id: int = Header(..., alias="X-User-Id")):
    try:
        eliminar_serie_por_session_id(session_id, user_id=x_user_id)
        return {"mensaje": "Serie eliminada correctamente."}
    except ValueError as ve:
        if "SERIE_CON_SEGMENTACIONES" in str(ve):
            raise HTTPException(
                status_code=409,
                detail="Esta serie tiene segmentaciones asociadas. Debes borrarlas primero.",
            )
        raise HTTPException(status_code=500, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
