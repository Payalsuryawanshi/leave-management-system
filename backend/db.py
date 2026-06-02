import oracledb
from contextlib import contextmanager
from config import DB_USER, DB_PASSWORD, DB_DSN

def get_connection():
    """Create and return Oracle database connection"""
    return oracledb.connect(
        user=DB_USER,
        password=DB_PASSWORD,
        dsn=DB_DSN
    )

@contextmanager
def get_db_cursor():
    conn = get_connection()
    cursor = conn.cursor()
    try:
        yield cursor, conn
    finally:
        cursor.close()
        conn.close()

def execute_query(query: str, params=None, fetch_one: bool = False, fetch_all: bool = True, commit: bool = False):
    """
    Execute a query and return results.
    
    fetch_one  = True  → returns single row (for SELECT WHERE id = ?)
    fetch_all  = True  → returns all rows (for SELECT list)
    commit     = True  → use for INSERT, UPDATE, DELETE
    """
    with get_db_cursor() as (cursor, conn):
        cursor.execute(query, params or [])

        if commit:
            conn.commit()
            return None

        if fetch_one:
            return cursor.fetchone()
        
        if fetch_all:
            return cursor.fetchall()
        
        return None