# ============================================
# MARVEL — services/user_service.py
# User business logic
# ============================================

from database.connection import execute_query


def get_user_by_id(user_id: int):
    """Get user by ID"""
    result = execute_query("SELECT * FROM users WHERE id = %s", (user_id,))
    return result[0] if result else None


def get_user_by_phone(phone: str):
    """Get user by phone number"""
    result = execute_query("SELECT * FROM users WHERE phone = %s", (phone,))
    return result[0] if result else None


def search_users(query: str):
    """Search users by phone number"""
    # Clean the query - remove spaces, dashes
    cleaned = query.replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
    result = execute_query(
        """SELECT id, phone, display_name, avatar_letter, avatar_color, 
                  status_text, is_online, last_seen 
           FROM users 
           WHERE phone LIKE %s OR display_name LIKE %s
           LIMIT 20""",
        (f"%{cleaned}%", f"%{query}%")
    )
    return result


def update_user(user_id: int, data: dict):
    """Update user profile"""
    allowed_fields = ["display_name", "username", "avatar_letter", "avatar_color", "status_text"]
    updates = []
    params = []
    
    for field in allowed_fields:
        if field in data and data[field] is not None:
            updates.append(f"{field} = %s")
            params.append(data[field])
    
    if not updates:
        return get_user_by_id(user_id)
    
    params.append(user_id)
    execute_query(
        f"UPDATE users SET {', '.join(updates)} WHERE id = %s",
        params,
        fetch=False
    )
    
    return get_user_by_id(user_id)


def set_user_online(user_id: int, online: bool):
    """Update online status"""
    execute_query(
        "UPDATE users SET is_online = %s, last_seen = NOW() WHERE id = %s",
        (online, user_id),
        fetch=False
    )