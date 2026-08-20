# ============================================
# MARVEL — config.py
# Database & application configuration
# ============================================

import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# -------- DATABASE CONFIG --------
DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": int(os.getenv("DB_PORT", 3306)),
    "user": os.getenv("DB_USER", "root"),
    "password": os.getenv("DB_PASSWORD", ""),
    "database": os.getenv("DB_NAME", "marvel_network"),
    "autocommit": True,
    "pool_name": "marvel_pool",
    "pool_size": 10,
    "pool_reset_session": True,
}

# -------- JWT CONFIG --------
JWT_SECRET = os.getenv("JWT_SECRET", "marvel-stark-jarvis-secret-key")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRY_HOURS = int(os.getenv("JWT_EXPIRY_HOURS", 72))

# -------- APP CONFIG --------
APP_NAME = os.getenv("APP_NAME", "MARVEL")
APP_VERSION = os.getenv("APP_VERSION", "1.0.0")
DEBUG = os.getenv("DEBUG", "true").lower() == "true"