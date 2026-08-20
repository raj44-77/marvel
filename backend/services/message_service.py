from database.connection import execute_query
def is_blocked(sender_id: int, receiver_id: int) -> bool:
    result = execute_query(
        """SELECT * FROM contacts 
           WHERE ((user_id = %s AND contact_id = %s) OR (user_id = %s AND contact_id = %s))
           AND is_blocked = TRUE""",
        (sender_id, receiver_id, receiver_id, sender_id)
    )
    return len(result) > 0
def send_message(sender_id: int, receiver_id: int, text: str, reply_to: int = None):
    if is_blocked(sender_id, receiver_id):
        return None, "You cannot message this contact."
    existing = execute_query(
        "SELECT * FROM contacts WHERE user_id = %s AND contact_id = %s",
        (receiver_id, sender_id)
    )
    if not existing:
        execute_query(
            "INSERT INTO contacts (user_id, contact_id, category, avenger_identity) VALUES (%s, %s, %s, NULL)",
            (receiver_id, sender_id, 'General'),
            fetch=False
        )
    existing2 = execute_query(
        "SELECT * FROM contacts WHERE user_id = %s AND contact_id = %s",
        (sender_id, receiver_id)
    )
    if not existing2:
        execute_query(
            "INSERT INTO contacts (user_id, contact_id, category, avenger_identity) VALUES (%s, %s, %s, NULL)",
            (sender_id, receiver_id, 'General'),
            fetch=False
        )
    import re
    sanitized_text = re.sub(r'<[^>]*>', '', text)
    sanitized_text = sanitized_text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;').replace("'", '&#39;')
    message_id = execute_query(
        "INSERT INTO messages (sender_id, receiver_id, text, reply_to) VALUES (%s, %s, %s, %s)",
        (sender_id, receiver_id, sanitized_text, reply_to),
        fetch=False
    )
    return execute_query("SELECT * FROM messages WHERE id = %s", (message_id,))[0], None
def get_messages(user_id: int, contact_id: int, limit: int = 50):
    return execute_query(
        """SELECT * FROM messages 
           WHERE (sender_id = %s AND receiver_id = %s) 
              OR (sender_id = %s AND receiver_id = %s)
           ORDER BY sent_at ASC
           LIMIT %s""",
        (user_id, contact_id, contact_id, user_id, limit)
    )
def delete_message(message_id: int, user_id: int):
    result = execute_query(
        "SELECT * FROM messages WHERE id = %s AND sender_id = %s AND deleted = FALSE",
        (message_id, user_id)
    )
    if not result:
        return False
    execute_query(
        "UPDATE messages SET deleted = TRUE, text = 'This message was deleted' WHERE id = %s",
        (message_id,),
        fetch=False
    )
    return True
def clear_conversation(user_id: int, contact_id: int):
    execute_query(
        "DELETE FROM messages WHERE (sender_id = %s AND receiver_id = %s) OR (sender_id = %s AND receiver_id = %s)",
        (user_id, contact_id, contact_id, user_id),
        fetch=False
    )
def mark_as_read(message_id: int, user_id: int):
    execute_query(
        "UPDATE messages SET is_read = TRUE, read_at = NOW() WHERE id = %s AND receiver_id = %s",
        (message_id, user_id),
        fetch=False
    )
def mark_all_as_read(sender_id: int, receiver_id: int):
    execute_query(
        """UPDATE messages SET is_read = TRUE, read_at = NOW() 
           WHERE sender_id = %s AND receiver_id = %s AND is_read = FALSE""",
        (sender_id, receiver_id),
        fetch=False
    )
def get_unread_count(user_id: int):
    result = execute_query(
        "SELECT COUNT(*) as count FROM messages WHERE receiver_id = %s AND is_read = FALSE AND deleted = FALSE",
        (user_id,)
    )
    return result[0]["count"] if result else 0