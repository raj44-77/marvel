from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
class MessageCreate(BaseModel):
    receiver_id: int
    text: str = Field(..., min_length=1, max_length=5000)
    reply_to: Optional[int] = None
class MessageResponse(BaseModel):
    id: int
    sender_id: int
    receiver_id: int
    text: str
    reply_to: Optional[int] = None
    deleted: bool
    is_read: bool
    sent_at: datetime
    read_at: Optional[datetime] = None