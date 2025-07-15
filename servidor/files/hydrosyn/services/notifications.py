async def create_user_notification(user_id: int, notification_id: int, **kwargs):
    username = kwargs.get('username', None)
    ip = kwargs.get('ip', 'unknown')
    lang = kwargs.get('lang', 'en')
    
    should_send = await get_should_send_email_for_notification_from_db(notification_id)
    if should_send:
            notification_email = await get_notifications_email_from_db(notification_id)
            
            if notification_email:
                
                notification_lang = notification_email["lang"]
                template = await get_notification_template_from_db(
                    notification_id=notification_id,
                    lang_code=notification_lang
                )
                client_ip = request.client.host if request.client else "unknown"
                formatted_msg = template['template_text'].format(
                    user=username,
                    ip=client_ip
                )
                send_email(
                    to=notification_email["email"],
                    subject=template['subject'],
                    body=formatted_msg
                )