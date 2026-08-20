from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
class ContactCreate(BaseModel):
    phone: str = Field(..., min_length=10, max_length=15)
    category: Optional[str] = "General"
    avenger_identity: Optional[str] = None
class ContactUpdate(BaseModel):
    category: Optional[str] = None
    is_favorite: Optional[bool] = None
    avenger_identity: Optional[str] = None
class ContactResponse(BaseModel):
    id: int
    contact_id: int
    contact_name: str
    contact_phone: str
    contact_avatar: str
    contact_color: str
    contact_status: str
    is_online: bool
    last_seen: datetime
    category: str
    avenger_identity: Optional[str] = None
    is_favorite: bool
    created_at: datetime