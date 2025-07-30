import os
import re
from typing import List, Dict
from config.db_config import get_connection


# ✅ Regex corregido para detectar el session_id incluso si hay subcarpetas
def extraer_session_id(ruta: str) -> str:
    match = re.search(r"series[\\/](.*?)[\\/]", ruta)
    return match.group(1) if match else None


def obtener_historial_archivos() -> List[Dict]:
    conn = get_connection()
    cursor = conn.cursor()

    query = """
    SELECT archivodicomid, nombrearchivo, rutaarchivo, fechacarga, sistemaid
    FROM archivodicom
    ORDER BY fechacarga DESC
    """
    cursor.execute(query)
    rows = cursor.fetchall()

    archivos = []
    for row in rows:
        ruta_relativa = row[2]

        # ✅ Convertir a ruta absoluta (desde raíz del proyecto)
        ruta_absoluta = os.path.abspath(ruta_relativa)

        # ✅ Ignorar si el archivo no existe
        if not os.path.exists(ruta_absoluta):
            continue

        session_id = extraer_session_id(ruta_relativa)
        archivos.append(
            {
                "archivodicomid": row[0],
                "nombrearchivo": row[1],
                "rutaarchivo": row[2],
                "fechacarga": row[3],
                "sistemaid": row[4],
                "session_id": session_id,
            }
        )

    cursor.close()
    conn.close()
    return archivos
