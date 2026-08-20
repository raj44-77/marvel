# ============================================
# MARVEL — middleware/auth_middleware.py
# JWT Authentication middleware
# ============================================

from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from services.auth_service import verify_token


class AuthMiddleware(BaseHTTPMiddleware):
    """Middleware to check JWT token on protected routes"""
    
    def __init__(self, app, exclude_paths: list = None):
        super().__init__(app)
        self.exclude_paths = exclude_paths or [
            "/docs",
            "/openapi.json",
            "/api/v1/auth/login",
            "/api/v1/auth/register",
        ]
    
    async def dispatch(self, request: Request, call_next):
        # Skip auth for excluded paths
        path = request.url.path
        
        for exclude in self.exclude_paths:
            if path.startswith(exclude):
                return await call_next(request)
        
        # Skip WebSocket (handled in ws.py)
        if path.startswith("/api/v1/ws"):
            return await call_next(request)
        
        # Check for Authorization header
        auth_header = request.headers.get("Authorization")
        
        if not auth_header or not auth_header.startswith("Bearer "):
            return JSONResponse(
                status_code=401,
                content={"detail": "Missing or invalid token"}
            )
        
        token = auth_header.split(" ")[1]
        payload = verify_token(token)
        
        if not payload:
            return JSONResponse(
                status_code=401,
                content={"detail": "Invalid or expired token"}
            )
        
        # Add user info to request state
        request.state.user_id = payload["user_id"]
        request.state.user_phone = payload["phone"]
        
        return await call_next(request)