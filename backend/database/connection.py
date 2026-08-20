# ============================================
# MARVEL — database/connection.py
# MySQL connection pool management
# ============================================

import mysql.connector
from mysql.connector import pooling
from config import DB_CONFIG

# Create connection pool
connection_pool = None

def get_pool():
    """Get or create the MySQL connection pool"""
    global connection_pool
    if connection_pool is None:
        connection_pool = pooling.MySQLConnectionPool(
            host=DB_CONFIG["host"],
            port=DB_CONFIG["port"],
            user=DB_CONFIG["user"],
            password=DB_CONFIG["password"],
            database=DB_CONFIG["database"],
            pool_name=DB_CONFIG["pool_name"],
            pool_size=DB_CONFIG["pool_size"],
            pool_reset_session=DB_CONFIG["pool_reset_session"],
            autocommit=DB_CONFIG["autocommit"],
        )
    return connection_pool

def get_connection():
    """Get a connection from the pool"""
    pool = get_pool()
    return pool.get_connection()

def execute_query(query, params=None, fetch=True):
    """Execute a query and return results"""
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute(query, params or ())
        if fetch:
            result = cursor.fetchall()
            return result
        else:
            conn.commit()
            return cursor.lastrowid
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cursor.close()
        conn.close()

def execute_many(query, params_list):
    """Execute multiple inserts"""
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
        conn.close()