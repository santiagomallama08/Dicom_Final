import sys
import os
from datetime import date

# Asegurar acceso a la carpeta raíz del proyecto
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from config.db_config import get_connection

def main():
    conn = None
    cursor = None

    try:
        conn = get_connection()
        cursor = conn.cursor()

        # Insertar nuevo sistema
        cursor.execute("INSERT INTO Sistema DEFAULT VALUES RETURNING SistemaID;")
        sistema_id = cursor.fetchone()[0]

        # Insertar nuevo usuario
        cursor.execute("""
            INSERT INTO Usuario (Nombre, Email, Rol, SistemaID)
            VALUES (%s, %s, %s, %s)
            RETURNING UsuarioID;
        """, ('Carlos Ramírez', 'carlos.ramirez@example.com', 'ingeniero', sistema_id))
        usuario_id = cursor.fetchone()[0]

        # Insertar nuevo reporte
        cursor.execute("""
            INSERT INTO Reporte (UsuarioID, SistemaID, FechaGeneracion)
            VALUES (%s, %s, %s)
            RETURNING ReporteID;
        """, (usuario_id, sistema_id, date.today()))
        reporte_id = cursor.fetchone()[0]

        # Insertar nuevo archivo DICOM
        cursor.execute("""
            INSERT INTO ArchivoDicom (NombreArchivo, RutaArchivo, FechaCarga, SistemaID)
            VALUES (%s, %s, %s, %s)
            RETURNING ArchivoDicomID;
        """, ('craneo_02.dcm', '/archivos/dicom2.dcm', date.today(), sistema_id))
        archivo_id = cursor.fetchone()[0]

        # Insertar nuevas dimensiones de prótesis
        cursor.execute("""
            INSERT INTO ProtesisDimension
              (ArchivoDicomID, TipoProtesis, Longitud, Ancho, Altura, Volumen, Unidad)
            VALUES (%s, %s, %s, %s, %s, %s, %s);
        """, (archivo_id, 'Temporal', 10.0, 7.5, 3.5, 320.75, 'cm3'))

        # Relación entre el reporte y el archivo DICOM
        cursor.execute("""
            INSERT INTO Reporte_ArchivoDicom (ReporteID, ArchivoDicomID)
            VALUES (%s, %s);
        """, (reporte_id, archivo_id))

        conn.commit()
        print("✅ Segunda prueba: datos insertados correctamente.")

    except Exception as e:
        if conn:
            conn.rollback()
        print(f"❌ Error durante la segunda inserción: {e}")

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
        print("🔒 Conexión cerrada.")

if __name__ == "__main__":
    main()
