# ============================================
# MARVEL — routes/users.py
# User management routes
# ============================================

from fastapi import APIRouter, HTTPException, Depends, Query
from models.user import UserUpdate
from routes.auth import get_current_user
from services.user_service import get_user_by_id, search_users, update_user

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me")
async def get_my_profile(user: dict = Depends(get_current_user)):
    """Get current user profile"""
    user_data = get_user_by_id(user["user_id"])
    if not user_data:
        raise HTTPException(status_code=404, detail="User not found")
    return user_data


@router.put("/me")
async def update_my_profile(data: UserUpdate, user: dict = Depends(get_current_user)):
    """Update current user profile"""
    updated = update_user(user["user_id"], data.model_dump(exclude_none=True))
    if not updated:
        raise HTTPException(status_code=404, detail="User not found")
    return updated


@router.get("/search")
async def search_users_endpoint(
    q: str = Query(..., min_length=1),
    user: dict = Depends(get_current_user)
):
    """Search users by phone number or name"""
    results = search_users(q)
    # Don't return the current user in search results
    return [r for r in results if r["id"] != user["user_id"]]