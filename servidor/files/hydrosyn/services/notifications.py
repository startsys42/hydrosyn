from db.db_notifications import get_templates_by_languages_from_db
from security.email import send_email
from db.db_notifications import get_should_send_email_for_notification_from_db, insert_notification_event_in_db, get_notifications_email_from_db
from db.db_roles import get_users_with_permission_notifications_from_db
from logger import logger
import os


async def create_user_notification( notification_id: int, **kwargs):
    user_id= kwargs.get('user_id', None)
    username = kwargs.get('username', None)
    ip = kwargs.get('ip', 'unknown')
    lang = kwargs.get('lang', None)
    notification_type = kwargs.get('notification_type', None)
    email = kwargs.get('email', None)
    old_email = kwargs.get('old_email', None)
    new_email = kwargs.get('new_email', None)
    date = kwargs.get('date', None)
    status = kwargs.get('status', None)
    context = {
    "user": username,
    "ip": ip,
    "old_email": old_email,
    "new_email": new_email,
    "status": status,
    "notification_type": notification_type
}
    #compruebo si ahy que envair email y en que idioam ya  uqe email 
    #envio
    #añado avisos a tabals de notificacioens para todos los usuarios necesarios
    # aviso al usuarioc orrespodneinte.
    unique_langs = set()
    should_send = await get_should_send_email_for_notification_from_db(notification_id)
    if should_send:
        email_notification, lang_notification = await get_notifications_email_from_db()
        unique_langs.add(lang_notification)
    if user_id:
        unique_langs.add(lang)
        '''
        user_email_lang = await get_user_email_and_language_from_db(user_id)
        if user_email_lang:
            email, lang = user_email_lang
            if lang not in unique_langs:
                unique_langs.add(lang)
        else:
            logger.warning(f"User ID {user_id} not found or inactive, skipping notification.")
      '''
       
            
                    
                    
    templates= await get_templates_by_languages_from_db(notification_id, unique_langs)

    for lang_code, data in templates.items():
        subject = data["subject"]
        text = data["template_text"]
        try:
            formatted_msg = text.format(**context)
        except KeyError as e:
            logger.warning(f"Falta variable en plantilla: {e}")
            continue  # O manejar el error de otra manera
        
        if user_id  and lang_code == lang:  
            send_email(
                        to=os.getenv("EMAIL_SENDER"),
                        subject=subject,
                        body=formatted_msg
                    )
        

        if should_send and notification_email and notification_lang== lang_code:
            send_email(
                        to=notification_email["email"],
                        subject= subject,
                        body=formatted_msg
                    )
        

        
        for user in users_notified:
            if user["language"] == lang_code:
                await insert_notification_event_in_db(
                    notification_id=notification_id,
                    user_id=user["id"],
                    lang_code=lang_code,
                    formatted_message=formatted_msg,
                    created_at=date,
                )
        
         
