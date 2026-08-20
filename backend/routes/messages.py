from fastapi import APIRouter, HTTPException, Depends, Query
from models.message import MessageCreate
from routes.auth import get_current_user
from services.message_service import (
    send_message, get_messages, mark_as_read,
    mark_all_as_read, get_unread_count, delete_message, clear_conversation
)
router = APIRouter(prefix="/messages", tags=["Messages"])
@router.get("/{contact_id}")
async def get_conversation(contact_id: int, limit: int = Query(50, ge=1, le=100), user: dict = Depends(get_current_user)):
    messages = get_messages(user["user_id"], contact_id, limit)
    mark_all_as_read(contact_id, user["user_id"])
    return messages
@router.post("")
async def create_message(data: MessageCreate, user: dict = Depends(get_current_user)):
    message, error = send_message(user["user_id"], data.receiver_id, data.text, data.reply_to)
    if error:
        raise HTTPException(status_code=403, detail=error)
    return {"message": "Sent", "data": message}
@router.delete("/{message_id}")
async def remove_message(message_id: int, user: dict = Depends(get_current_user)):
    result = delete_message(message_id, user["user_id"])
    if not result:
        raise HTTPException(status_code=404, detail="Message not found")
    return {"message": "Deleted"}
@router.delete("/clear/{contact_id}")
async def clear_chat(contact_id: int, user: dict = Depends(get_current_user)):
    clear_conversation(user["user_id"], contact_id)
    return {"message": "Conversation cleared"}
@router.put("/{message_id}/read")
async def read_message(message_id: int, user: dict = Depends(get_current_user)):
    mark_as_read(message_id, user["user_id"])
    return {"message": "Marked as read"}
@router.get("/unread/count")
async def unread_count(user: dict = Depends(get_current_user)):
    count = get_unread_count(user["user_id"])
    return {"unread_count": count}