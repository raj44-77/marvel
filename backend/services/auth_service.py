# ============================================
# MARVEL — services/auth_service.py
# Authentication business logic with password
# ============================================

from datetime import datetime, timedelta
from jose import jwt, JWTError
import bcrypt
from config import JWT_SECRET, JWT_ALGORITHM, JWT_EXPIRY_HOURS
from database.connection import execute_query

# Password hashing



def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))


def create_token(user_id: int, phone: str) -> str:
    """Generate JWT token"""
    expiry = datetime.utcnow() + timedelta(hours=JWT_EXPIRY_HOURS)
    payload = {
        "user_id": user_id,
        "phone": phone,
        "exp": expiry
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    
    execute_query(
        "INSERT INTO auth_tokens (user_id, token, expires_at) VALUES (%s, %s, %s)",
        (user_id, token, expiry),
        fetch=False
    )
    
    return token


def verify_token(token: str) -> dict:
    """Verify JWT token and return payload"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        
        result = execute_query(
            "SELECT * FROM auth_tokens WHERE token = %s AND expires_at > NOW()",
            (token,)
        )
        if not result:
            return None
        
        return payload
    except JWTError:
        return None


def invalidate_token(token: str):
    """Remove token from database"""
    execute_query(
        "DELETE FROM auth_tokens WHERE token = %s",
        (token,),
        fetch=False
    )


def register_user(phone: str, password: str, display_name: str, username: str = None, status_text: str = ""):
    """Register a new user with password"""
    # Check if user already exists
    existing = execute_query("SELECT * FROM users WHERE phone = %s", (phone,))
    if existing:
        return None, "User with this phone number already exists"
    
    # Hash the password
    password_hash = hash_password(password)
    
    # Create new user
    avatar_letter = display_name[0].upper() if display_name else "U"
    user_id = execute_query(
        """INSERT INTO users (phone, password_hash, username, display_name, avatar_letter, status_text, is_online) 
           VALUES (%s, %s, %s, %s, %s, %s, TRUE)""",
        (phone, password_hash, username, display_name, avatar_letter, status_text),
        fetch=False
    )
    
    user = execute_query("SELECT * FROM users WHERE id = %s", (user_id,))[0]
    # Remove password_hash from response
    user.pop("password_hash", None)
    return user, None


def login_user(phone: str, password: str):
    """Login user with phone and password"""
    user = execute_query("SELECT * FROM users WHERE phone = %s", (phone,))
    if not user:
        return None, "User not found. Please register first."
    
    user = user[0]
    
    # Check if user has a password set
    if not user.get("password_hash"):
        return None, "No password set. Please use the old login method or reset your password."
    
    # Verify password
    if not verify_password(password, user["password_hash"]):
        return None, "Incorrect password. Please try again."
    
    # Update online status
    execute_query(
        "UPDATE users SET is_online = TRUE, last_seen = NOW() WHERE id = %s",
        (user["id"],),
        fetch=False
    )
    
    # Remove password_hash from response
    user.pop("password_hash", None)
    return user, None


def logout_user(user_id: int):
    """Set user offline and remove tokens"""
    execute_query(
        "UPDATE users SET is_online = FALSE, last_seen = NOW() WHERE id = %s",
        (user_id,),
        fetch=False
    )
    execute_query(
        "DELETE FROM auth_tokens WHERE user_id = %s",
        (user_id,),
        fetch=False
    )