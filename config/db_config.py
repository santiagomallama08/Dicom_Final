#config/db_config.py
import psycopg2

def get_connection():
    return psycopg2.connect(
        dbname="trabajoGrado",
        user="postgres",
        password="12345",
        host="localhost",
        port="5432"
    )