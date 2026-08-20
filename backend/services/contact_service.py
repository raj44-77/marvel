from database.connection import execute_query
from services.user_service import get_user_by_phone
def add_contact(user_id: int, phone: str, category: str = "General", avenger_identity: str = None):
    contact_user = get_user_by_phone(phone)
    if not contact_user:
        return None, "User not found. Make sure they are registered on MARVEL."
    contact_id = contact_user["id"]
    if user_id == contact_id:
        return None, "You cannot add yourself as a contact."
    existing = execute_query(
        "SELECT * FROM contacts WHERE user_id = %s AND contact_id = %s",
        (user_id, contact_id)
    )
    if existing:
        return None, "Contact already exists in your list."
    contact_pk = execute_query(
        "INSERT INTO contacts (user_id, contact_id, category, avenger_identity) VALUES (%s, %s, %s, %s)",
        (user_id, contact_id, category, avenger_identity),
        fetch=False
    )
    return execute_query(
        """SELECT c.*, u.display_name, u.phone, u.avatar_letter, u.avatar_color, 
                  u.status_text, u.is_online, u.last_seen
           FROM contacts c
           JOIN users u ON c.contact_id = u.id
           WHERE c.id = %s""",
        (contact_pk,)
    )[0], None
def get_contacts(user_id: int):
    return execute_query(
        """SELECT c.*, 
                  u.display_name as contact_name, u.phone as contact_phone,
                  u.avatar_letter as contact_avatar, u.avatar_color as contact_color,
                  u.status_text as contact_status, u.is_online, u.last_seen,
                  (SELECT is_blocked FROM contacts WHERE user_id = c.contact_id AND contact_id = c.user_id) as blocked_by_them
           FROM contacts c
           JOIN users u ON c.contact_id = u.id
           WHERE c.user_id = %s
           ORDER BY c.is_favorite DESC, u.display_name ASC""",
        (user_id,)
    )
def remove_contact(user_id: int, contact_id: int):
    execute_query(
        "DELETE FROM contacts WHERE id = %s AND user_id = %s",
        (contact_id, user_id),
        fetch=False
    )
def toggle_favorite(user_id: int, contact_id: int):
    contact = execute_query(
        "SELECT is_favorite FROM contacts WHERE id = %s AND user_id = %s",
        (contact_id, user_id)
    )
    if not contact:
        return None
    new_status = not contact[0]["is_favorite"]
    execute_query(
        "UPDATE contacts SET is_favorite = %s WHERE id = %s AND user_id = %s",
        (new_status, contact_id, user_id),
        fetch=False
    )
    return new_status
def toggle_block(user_id: int, contact_id: int):
    contact = execute_query(
        "SELECT is_blocked FROM contacts WHERE id = %s AND user_id = %s",
        (contact_id, user_id)
    )
    if not contact:
        return None
    new_status = not contact[0]["is_blocked"]
    execute_query(
        "UPDATE contacts SET is_blocked = %s WHERE id = %s AND user_id = %s",
        (new_status, contact_id, user_id),
        fetch=False
    )
    return new_status
def can_chat(user_id: int, other_id: int) -> bool:
    result = execute_query(
        """SELECT * FROM contacts 
           WHERE (user_id = %s AND contact_id = %s) 
              OR (user_id = %s AND contact_id = %s)""",
        (user_id, other_id, other_id, user_id)
    )
    return len(result) > 0