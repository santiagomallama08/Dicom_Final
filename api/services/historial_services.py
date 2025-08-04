import os
import re
import shutil
from typing import List, Dict
from config.db_config import get_connection


def extraer_session_id(ruta: str) -> str:
    """Extrae el session_id desde la ruta del archivo usando regex."""
    match = re.search(r"series[\\/](.*?)[\\/]", ruta)
    return match.group(1) if match else None


def obtener_historial_archivos() -> List[Dict]:
    """Obtiene las series únicas de DICOM registradas en la base de datos."""
    conn = get_connection()
    cursor = conn.cursor()

    query = """
        SELECT archivodicomid, nombrearchivo, rutaarchivo, fechacarga, sistemaid
        FROM archivodicom
        ORDER BY fechacarga DESC
    """
    cursor.execute(query)
    rows = cursor.fetchall()

    series_dict = {}

    for row in rows:
        ruta_relativa = row[2]
        ruta_absoluta = os.path.abspath(ruta_relativa)

        if not os.path.exists(ruta_absoluta):
            continue

        session_id = extraer_session_id(ruta_relativa)
        if not session_id:
            continue

        # Solo guardar una entrada por session_id
        if session_id not in series_dict:
            series_dict[session_id] = {
                "archivodicomid": row[0],
                "nombrearchivo": session_id,  # se muestra el session_id como nombre visible
                "rutaarchivo": row[2],
                "fechacarga": row[3],
                "sistemaid": row[4],
                "session_id": session_id,
            }

    cursor.close()
    conn.close()
    return list(series_dict.values())


def eliminar_serie_por_session_id(session_id: str) -> None:
    """Elimina una serie completa: registros DICOM, imágenes y segmentaciones."""
    conn = get_connection()
    cursor = conn.cursor()

    # 1. Eliminar registros de la base de datos
    cursor.execute(
        "DELETE FROM archivodicom WHERE rutaarchivo LIKE %s",
        [f"%{session_id}%"]
    )
    conn.commit()

    # 2. Eliminar la carpeta de imágenes y mapping
    ruta_series = os.path.abspath(f"api/static/series/{session_id}")
    if os.path.isdir(ruta_series):
        shutil.rmtree(ruta_series)

    # 3. Eliminar segmentaciones asociadas
    ruta_segmentaciones = os.path.abspath(f"api/static/segmentations/{session_id}")
    if os.path.isdir(ruta_segmentaciones):
        shutil.rmtree(ruta_segmentaciones)

    cursor.close()
    conn.close()
