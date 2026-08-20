# ============================================
# MARVEL — routes/auth.py
# Authentication routes
# ============================================

from fastapi import APIRouter, HTTPException, Header, Depends
from models.user import UserRegister, UserLogin
from services.auth_service import register_user, login_user, logout_user, create_token, verify_token

router = APIRouter(prefix="/auth", tags=["Authentication"])
# Simple in-memory rate limiter
login_attempts = {}
def check_rate_limit(phone: str) -> bool:
    import time
    now = time.time()
    if phone not in login_attempts:
        login_attempts[phone] = []
    # Remove old attempts
    login_attempts[phone] = [t for t in login_attempts[phone] if now - t < 300]
    if len(login_attempts[phone]) >= 5:
        return False
    login_attempts[phone].append(now)
    return True


def get_current_user(authorization: str = Header(None)):
    """Dependency to get current user from JWT token"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    
    token = authorization.split(" ")[1]
    payload = verify_token(token)
    
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    return payload


@router.post("/register")
async def register(data: UserRegister):
    """Register a new user with password"""
    user, error = register_user(
        phone=data.phone,
        password=data.password,
        display_name=data.display_name,
        username=data.username,
        status_text=data.status_text
    )
    
    if error:
        raise HTTPException(status_code=400, detail=error)
    
    token = create_token(user["id"], user["phone"])
    
    return {
        "token": token,
        "user": user
    }


@router.post("/login")
async def login(data: UserLogin):
    """Login with phone and password"""
    user, error = login_user(data.phone, data.password)
    
    if error:
        raise HTTPException(status_code=401, detail=error)
    
    token = create_token(user["id"], user["phone"])
    
    return {
        "token": token,
        "user": user
    }


@router.post("/logout")
async def logout(user: dict = Depends(get_current_user)):
    """Logout user"""
    try:
        logout_user(user["user_id"])
        return {"message": "Logged out successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))