# modules/database/dao.py

import os
from datetime import date
import psycopg2
from config.db_config import get_connection

def get_or_create_archivo_dicom(nombre_archivo: str, ruta_archivo: str, sistema_id: int) -> int:
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT ArchivoDicomID
              FROM ArchivoDicom
             WHERE RutaArchivo = %s
        """, (ruta_archivo,))
        row = cur.fetchone()
        if row:
            return row[0]

        cur.execute("""
            INSERT INTO ArchivoDicom (NombreArchivo, RutaArchivo, FechaCarga, SistemaID)
            VALUES (%s, %s, %s, %s)
            RETURNING ArchivoDicomID
        """, (nombre_archivo, ruta_archivo, date.today(), sistema_id))
        archivo_id = cur.fetchone()[0]
        conn.commit()
        return archivo_id
    finally:
        cur.close()
        conn.close()


def insert_protesis_dimension(archivo_dicom_id: int,
                              tipo_protesis: str,
                              dimensiones: dict) -> bool:
    """
    Inserta las dimensiones en ProtesisDimension si aún no existe un registro
    para (ArchivoDicomID, TipoProtesis). Devuelve True si insertó, False si ya existía.
    """
    conn = get_connection()
    cur = conn.cursor()
    try:
        # Verificar duplicado
        cur.execute("""
            SELECT 1
              FROM ProtesisDimension
             WHERE ArchivoDicomID = %s
               AND TipoProtesis   = %s
        """, (archivo_dicom_id, tipo_protesis))
        if cur.fetchone():
            return False

        # Convertir a float de Python para evitar np.float64
        longitud = float(dimensiones["Longitud (mm)"])
        ancho     = float(dimensiones["Ancho (mm)"])
        altura    = float(dimensiones["Altura (mm)"])
        volumen   = float(dimensiones["Volumen (mm³)"])
        unidad    = "mm"

        cur.execute("""
            INSERT INTO ProtesisDimension
              (ArchivoDicomID, TipoProtesis, Longitud, Ancho, Altura, Volumen, Unidad)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (
            archivo_dicom_id,
            tipo_protesis,
            longitud,
            ancho,
            altura,
            volumen,
            unidad
        ))
        conn.commit()
        return True
    finally:
        cur.close()
        conn.close()
