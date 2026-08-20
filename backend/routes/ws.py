# ============================================
# MARVEL — routes/ws.py
# WebSocket handler for real-time messaging
# ============================================

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict
import json
from services.auth_service import verify_token
from services.user_service import set_user_online, get_user_by_id
from services.message_service import send_message
from datetime import datetime

router = APIRouter()

# Store active connections: {user_id: websocket}
active_connections: Dict[int, WebSocket] = {}


async def notify_user(user_id: int, data: dict):
    """Send data to a specific user if they're connected"""
    if user_id in active_connections:
        try:
            await active_connections[user_id].send_json(data)
        except:
            # Remove dead connection
            del active_connections[user_id]


async def notify_contacts(user_id: int, data: dict):
    """Notify all contacts of a user"""
    from services.contact_service import get_contacts
    contacts = get_contacts(user_id)
    for contact in contacts:
        await notify_user(contact["contact_id"], data)


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket connection for real-time communication"""
    
    # Accept connection first
    await websocket.accept()
    
    # Wait for authentication
    try:
        auth_data = await websocket.receive_json()
        token = auth_data.get("token")
        
        if not token:
            await websocket.send_json({"type": "error", "message": "Authentication required"})
            await websocket.close()
            return
        
        # Verify token
        payload = verify_token(token)
        if not payload:
            await websocket.send_json({"type": "error", "message": "Invalid token"})
            await websocket.close()
            return
        
        user_id = payload["user_id"]
        
        # Store connection
        active_connections[user_id] = websocket
        
        # Set user online
        set_user_online(user_id, True)
        
        # Notify contacts that user is online
        await notify_contacts(user_id, {
            "type": "online_status",
            "user_id": user_id,
            "online": True
        })
        
        # Send confirmation
        await websocket.send_json({
            "type": "connected",
            "user_id": user_id,
            "message": "Connected to MARVEL network"
        })
        
        # Listen for messages
        while True:
            try:
                data = await websocket.receive_json()
                await handle_message(user_id, data)
            except WebSocketDisconnect:
                break
            except Exception as e:
                await websocket.send_json({"type": "error", "message": str(e)})
    
    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await websocket.send_json({"type": "error", "message": str(e)})
        except:
            pass
    finally:
        # Cleanup on disconnect
        if user_id in active_connections:
            del active_connections[user_id]
            set_user_online(user_id, False)
            
            # Notify contacts that user is offline
            await notify_contacts(user_id, {
                "type": "online_status",
                "user_id": user_id,
                "online": False
            })


async def handle_message(user_id: int, data: dict):
    """Handle incoming WebSocket messages"""
    msg_type = data.get("type")
    
    if msg_type == "send_message":
        receiver_id = data.get("receiver_id")
        text = data.get("text", "").strip()
        
        if not receiver_id or not text:
            await notify_user(user_id, {
                "type": "error",
                "message": "receiver_id and text are required"
            })
            return
        
        # Check if blocked
        from services.message_service import is_blocked
        if is_blocked(user_id, receiver_id):
            await notify_user(user_id, {"type": "error", "message": "You cannot message this contact."})
            return
        # Save message to database
        message, error = send_message(user_id, receiver_id, text)
        
        if error:
            await notify_user(user_id, {"type": "error", "message": error})
            return
        
        # Send to receiver if online
        await notify_user(receiver_id, {
            "type": "new_message",
            "message": {
                "id": message["id"],
                "sender_id": message["sender_id"],
                "receiver_id": message["receiver_id"],
                "text": message["text"],
                "is_read": message["is_read"],
                "sent_at": str(message["sent_at"])
            }
        })
        
        # Confirm to sender
        await notify_user(user_id, {
            "type": "message_sent",
            "message": {
                "id": message["id"],
                "sender_id": message["sender_id"],
                "receiver_id": message["receiver_id"],
                "text": message["text"],
                "is_read": message["is_read"],
                "sent_at": str(message["sent_at"])
            }
        })
    
    elif msg_type == "typing":
        receiver_id = data.get("receiver_id")
        is_typing = data.get("is_typing", False)
        
        if receiver_id:
            await notify_user(receiver_id, {
                "type": "typing",
                "user_id": user_id,
                "is_typing": is_typing
            })
    
    elif msg_type == "mark_read":
        message_id = data.get("message_id")
        if message_id:
            from services.message_service import mark_as_read
            mark_as_read(message_id, user_id)
            
            # Get message sender
            from database.connection import execute_query
            msg = execute_query("SELECT sender_id FROM messages WHERE id = %s", (message_id,))
            if msg:
                await notify_user(msg[0]["sender_id"], {
                    "type": "message_read",
                    "message_id": message_id,
                    "read_by": user_id,
                    "read_at": str(datetime.utcnow())
                })
    
    elif msg_type == "ping":
        await notify_user(user_id, {"type": "pong"})