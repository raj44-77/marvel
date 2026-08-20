import os
from dotenv import load_dotenv
load_dotenv()
DB_CONFIG = {
    "database_url": os.getenv("DATABASE_URL", ""),
    "host": os.getenv("DB_HOST", "localhost"),
    "port": int(os.getenv("DB_PORT", 5432)),
    "user": os.getenv("DB_USER", "postgres"),
    "password": os.getenv("DB_PASSWORD", ""),
    "database": os.getenv("DB_NAME", "marvel_network"),
}
JWT_SECRET = os.getenv("JWT_SECRET", "marvel-stark-jarvis-secret-key")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRY_HOURS = int(os.getenv("JWT_EXPIRY_HOURS", 72))
APP_NAME = os.getenv("APP_NAME", "MARVEL")
APP_VERSION = os.getenv("APP_VERSION", "1.0.0")
DEBUG = os.getenv("DEBUG", "false").lower() == "true"