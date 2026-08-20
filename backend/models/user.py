# ============================================
# MARVEL — models/user.py
# User Pydantic models
# ============================================

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class UserRegister(BaseModel):
    phone: str = Field(..., min_length=10, max_length=15)
    password: str = Field(..., min_length=6, max_length=100)
    display_name: str = Field(..., min_length=2, max_length=100)
    username: Optional[str] = Field(None, max_length=50)
    status_text: Optional[str] = Field("", max_length=200)


class UserLogin(BaseModel):
    phone: str = Field(..., min_length=10, max_length=15)
    password: str = Field(..., min_length=1, max_length=100)


class UserUpdate(BaseModel):
    display_name: Optional[str] = Field(None, max_length=100)
    username: Optional[str] = Field(None, max_length=50)
    avatar_letter: Optional[str] = Field(None, max_length=1)
    avatar_color: Optional[str] = Field(None, max_length=7)
    status_text: Optional[str] = Field(None, max_length=200)


class UserResponse(BaseModel):
    id: int
    phone: str
    username: Optional[str] = None
    display_name: str
    avatar_letter: str
    avatar_color: str
    status_text: str
    is_online: bool
    last_seen: datetime
    created_at: datetime


class UserPublic(BaseModel):
    id: int
    phone: str
    display_name: str
    avatar_letter: str
    avatar_color: str
    status_text: str
    is_online: bool
    last_seen: datetime