import psycopg2
import psycopg2.pool
from config import DB_CONFIG
import urllib.parse
connection_pool = None
def get_pool():
    global connection_pool
    if connection_pool is None:
        db_url = DB_CONFIG.get("database_url", "")
        if db_url:
            result = urllib.parse.urlparse(db_url)
            connection_pool = psycopg2.pool.SimpleConnectionPool(
                1, 10,
                host=result.hostname,
                port=result.port or 5432,
                user=result.username,
                password=result.password,
                database=result.path[1:]
            )
        else:
            connection_pool = psycopg2.pool.SimpleConnectionPool(
                1, 10,
                host=DB_CONFIG["host"],
                port=DB_CONFIG["port"],
                user=DB_CONFIG["user"],
                password=DB_CONFIG["password"],
                database=DB_CONFIG["database"]
            )
    return connection_pool
def get_connection():
    pool = get_pool()
    return pool.getconn()
def execute_query(query, params=None, fetch=True):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        import psycopg2.extras
        cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cursor.execute(query, params or ())
        if fetch:
            result = cursor.fetchall()
            return result
        else:
            conn.commit()
            try:
                return cursor.fetchone()[0] if cursor.description else None
            except:
                return None
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cursor.close()
        get_pool().putconn(conn)
def execute_many(query, params_list):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.executemany(query, params_list)
        conn.commit()
        return cursor.rowcount
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cursor.close()
        get_pool().putconn(conn)