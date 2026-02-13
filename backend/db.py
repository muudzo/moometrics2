import os
import logging
from contextlib import contextmanager
from psycopg2 import pool
from dotenv import load_dotenv

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("db")

# Connection parameters
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")

try:
    postgreSQL_pool = pool.ThreadedConnectionPool(
        1, 20,
        user=DB_USER,
        password=DB_PASS,
        host=DB_HOST,
        port=DB_PORT,
        database=DB_NAME
    )
    if postgreSQL_pool:
        logger.info("Connection pool created successfully")
except Exception as e:
    logger.error(f"Error while creating connection pool: {e}")
    postgreSQL_pool = None

@contextmanager
def get_db_connection():
    conn = postgreSQL_pool.getconn()
    try:
        yield conn
    finally:
        postgreSQL_pool.putconn(conn)

@contextmanager
def get_db_cursor():
    with get_db_connection() as conn:
        cursor = conn.cursor()
        try:
            yield cursor
        finally:
            cursor.close()

def get_db():
    """Dependency for FastAPI"""
    conn = postgreSQL_pool.getconn()
    try:
        yield conn
    finally:
        postgreSQL_pool.putconn(conn)
