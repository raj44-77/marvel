import psycopg
from config import DB_CONFIG
def get_connection():
    db_url = DB_CONFIG.get("database_url", "")
    if db_url:
        return psycopg.connect(db_url)
    return psycopg.connect(
        host=DB_CONFIG["host"],
        port=DB_CONFIG["port"],
        user=DB_CONFIG["user"],
        password=DB_CONFIG["password"],
        dbname=DB_CONFIG["database"]
    )
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
        conn.close()
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
        conn.close()