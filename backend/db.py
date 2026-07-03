"""Acceso a la base de datos SIN ORM: conexiones PyMySQL y SQL crudo.

El esquema y los datos maestros se crean con db/script.sql (lo ejecuta MySQL
al inicializar el contenedor); la aplicación solo consume la base ya creada.
"""

import os

import pymysql
from pymysql.cursors import DictCursor

DB_CONFIG = {
    "host": os.getenv("DB_HOST", "db"),
    "port": int(os.getenv("DB_PORT", "3306")),
    "user": os.getenv("DB_USER", "app"),
    "password": os.getenv("DB_PASSWORD", "app"),
    "database": os.getenv("DB_NAME", "deportes_ucu"),
    "charset": "utf8mb4",
    "cursorclass": DictCursor,   # las filas vuelven como dict {columna: valor}
    "autocommit": False,
}


def get_conn():
    """Dependencia de FastAPI: una conexión por request.

    Hace commit si el endpoint terminó bien y rollback si lanzó excepción.
    """
    conn = pymysql.connect(**DB_CONFIG)
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def fetch_all(conn, sql, params=None):
    with conn.cursor() as cur:
        cur.execute(sql, params or ())
        return cur.fetchall()


def fetch_one(conn, sql, params=None):
    with conn.cursor() as cur:
        cur.execute(sql, params or ())
        return cur.fetchone()


def execute(conn, sql, params=None):
    """Ejecuta INSERT/UPDATE/DELETE y devuelve (filas_afectadas, lastrowid)."""
    with conn.cursor() as cur:
        cur.execute(sql, params or ())
        return cur.rowcount, cur.lastrowid
