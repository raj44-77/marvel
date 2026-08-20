from fastapi import APIRouter, HTTPException, Depends
from models.contact import ContactCreate
from routes.auth import get_current_user
from services.contact_service import add_contact, get_contacts, remove_contact, toggle_favorite, toggle_block
router = APIRouter(prefix="/contacts", tags=["Contacts"])
@router.get("")
async def list_contacts(user: dict = Depends(get_current_user)):
    contacts = get_contacts(user["user_id"])
    return contacts
@router.post("")
async def create_contact(data: ContactCreate, user: dict = Depends(get_current_user)):
    contact, error = add_contact(user["user_id"], data.phone, data.category, data.avenger_identity)
    if error:
        raise HTTPException(status_code=400, detail=error)
    return {"message": "Contact added successfully", "contact": contact}
@router.delete("/{contact_id}")
async def delete_contact(contact_id: int, user: dict = Depends(get_current_user)):
    remove_contact(user["user_id"], contact_id)
    return {"message": "Contact removed"}
@router.put("/{contact_id}/avenger")
async def update_avenger(contact_id: int, data: dict, user: dict = Depends(get_current_user)):
    from database.connection import execute_query
    avenger = data.get("avenger_identity")
    if not avenger:
        raise HTTPException(status_code=400, detail="Avenger identity is required")
    execute_query(
        "UPDATE contacts SET avenger_identity = %s WHERE id = %s AND user_id = %s",
        (avenger, contact_id, user["user_id"]),
        fetch=False
    )
    return {"message": "Avenger identity updated", "avenger_identity": avenger}
@router.put("/{contact_id}/favorite")
async def favorite_contact(contact_id: int, user: dict = Depends(get_current_user)):
    status = toggle_favorite(user["user_id"], contact_id)
    if status is None:
        raise HTTPException(status_code=404, detail="Contact not found")
    return {"is_favorite": status}
@router.put("/{contact_id}/block")
async def block_contact(contact_id: int, user: dict = Depends(get_current_user)):
    status = toggle_block(user["user_id"], contact_id)
    if status is None:
        raise HTTPException(status_code=404, detail="Contact not found")
    return {"is_blocked": status}