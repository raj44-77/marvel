import psycopg
import psycopg.pool
from config import DB_CONFIG
import urllib.parse
connection_pool = None
def get_pool():
    global connection_pool
    if connection_pool is None:
        db_url = DB_CONFIG.get("database_url", "")
        if db_url:
            connection_pool = psycopg.pool.ConnectionPool(db_url, min_size=1, max_size=10)
        else:
            result = urllib.parse.urlparse(db_url)
            dsn = f"host={result.hostname} port={result.port or 5432} user={result.username} password={result.password} dbname={result.path[1:]}"
            connection_pool = psycopg.pool.ConnectionPool(dsn, min_size=1, max_size=10)
    return connection_pool
def get_connection():
    return get_pool().getconn()
def execute_query(query, params=None, fetch=True):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(query, params or ())
            if fetch:
                columns = [desc[0] for desc in cursor.description] if cursor.description else []
                rows = cursor.fetchall()
                return [dict(zip(columns, row)) for row in rows]
            else:
                conn.commit()
                if cursor.description:
                    row = cursor.fetchone()
                    return row[0] if row else None
                return None
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        get_pool().putconn(conn)
def execute_many(query, params_list):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.executemany(query, params_list)
            conn.commit()
            return cursor.rowcount
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        get_pool().putconn(conn)