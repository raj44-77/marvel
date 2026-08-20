# ============================================
# MARVEL — main.py
# FastAPI application entry point
# ============================================

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import sys, os
sys.path.append(os.path.dirname(__file__))
from config import APP_NAME, APP_VERSION, DEBUG
import os

# Import routes
from routes.auth import router as auth_router
from routes.users import router as users_router
from routes.contacts import router as contacts_router
from routes.messages import router as messages_router
from routes.ws import router as ws_router

# Create FastAPI app
app = FastAPI(
    title=APP_NAME,
    version=APP_VERSION,
    description="MARVEL — Private Communication Network API",
    docs_url="/docs" if DEBUG else None,
)

# -------- CORS --------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------- API ROUTES --------
API_PREFIX = "/api/v1"

app.include_router(auth_router, prefix=API_PREFIX)
app.include_router(users_router, prefix=API_PREFIX)
app.include_router(contacts_router, prefix=API_PREFIX)
app.include_router(messages_router, prefix=API_PREFIX)
app.include_router(ws_router, prefix=API_PREFIX)

# -------- SERVE FRONTEND --------
FRONTEND_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend")

if os.path.exists(FRONTEND_DIR):
    from fastapi.middleware.cors import CORSMiddleware as CM
    @app.middleware("http")
    async def no_cache(request, call_next):
        response = await call_next(request)
        if request.url.path.startswith(("/css/", "/js/", "/pages/")):
            response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
            response.headers["Pragma"] = "no-cache"
            response.headers["Expires"] = "0"
        return response
    app.mount("/css", StaticFiles(directory=os.path.join(FRONTEND_DIR, "css")), name="css")
    app.mount("/js", StaticFiles(directory=os.path.join(FRONTEND_DIR, "js")), name="js")
    app.mount("/pages", StaticFiles(directory=os.path.join(FRONTEND_DIR, "pages")), name="pages")
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIR, "assets")), name="assets")
    
    @app.get("/")
    async def root():
        return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))

# -------- CREATE TABLES ON STARTUP --------
@app.on_event("startup")
async def create_tables():
    try:
        from database.connection import execute_query
        execute_query('''CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, phone VARCHAR(15) UNIQUE NOT NULL, password_hash VARCHAR(255), username VARCHAR(50) UNIQUE, display_name VARCHAR(100) NOT NULL, avatar_letter CHAR(1) DEFAULT 'U', avatar_color VARCHAR(7) DEFAULT '#e01a2b', status_text VARCHAR(200) DEFAULT '', is_online BOOLEAN DEFAULT FALSE, last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''', fetch=False)
        execute_query('''CREATE TABLE IF NOT EXISTS contacts (id SERIAL PRIMARY KEY, user_id INT NOT NULL, contact_id INT NOT NULL, category VARCHAR(50) DEFAULT 'General', avenger_identity VARCHAR(50), is_favorite BOOLEAN DEFAULT FALSE, is_blocked BOOLEAN DEFAULT FALSE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''', fetch=False)
        execute_query('''CREATE TABLE IF NOT EXISTS messages (id SERIAL PRIMARY KEY, sender_id INT NOT NULL, receiver_id INT NOT NULL, text TEXT NOT NULL, reply_to INT DEFAULT NULL, deleted BOOLEAN DEFAULT FALSE, is_read BOOLEAN DEFAULT FALSE, sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, read_at TIMESTAMP NULL)''', fetch=False)
        execute_query('''CREATE TABLE IF NOT EXISTS auth_tokens (id SERIAL PRIMARY KEY, user_id INT NOT NULL, token VARCHAR(500) NOT NULL UNIQUE, expires_at TIMESTAMP NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''', fetch=False)
        print("Tables created/verified!")
    except Exception as e:
        print(f"Table creation error: {e}")
# -------- HEALTH --------
@app.get("/health")
async def health():
    return {"status": "healthy"}