#config/db_config.py
import psycopg2

def get_connection():
    return psycopg2.connect(
        dbname="DicomFinal",
        user="postgres",
        password="31591950",
        host="localhost",
        port="5432"
    )