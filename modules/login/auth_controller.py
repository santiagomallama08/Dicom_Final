# modules/login/auth_controller.py

import psycopg2
from config.db_config import get_connection
from modules.login.hashing import hash_password, verify_password

def registrar_usuario(nombre, email, password, rol="usuario"):
    try:
        conn = get_connection()
        cursor = conn.cursor()

        hashed_pw = hash_password(password)
        cursor.execute("""
            INSERT INTO login_usuarios (nombre_completo, email, contraseña, rol)
            VALUES (%s, %s, %s, %s)
        """, (nombre, email, hashed_pw, rol))

        conn.commit()
        return True, "Registro exitoso"
    except psycopg2.Error as e:
        return False, f"Error en registro: {e}"
    finally:
        if conn:
            conn.close()

def verificar_credenciales(email, password):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT contraseña FROM login_usuarios WHERE email = %s", (email,))
        result = cursor.fetchone()
        if result:
            return verify_password(password, result[0])
        return False
    except Exception as e:
        print(f"Error al verificar: {e}")
        return False
    finally:
        if conn:
            conn.close()

def obtener_id_usuario(email):
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT id FROM login_usuarios WHERE email = %s", (email,))
        result = cur.fetchone()
        return result[0] if result else None
    finally:
        cur.close()
        conn.close()
