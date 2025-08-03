

import re
from typing import Optional, Tuple, List, Dict
from sqlalchemy import text
from db.db_engine import DBEngine  # Asegúrate de importar tu DBEngine
from logger import logger
from datetime import datetime, timezone

EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$')

async def get_should_send_email_for_notification_from_db(notification_id: int) -> bool:

    """
    Consulta si se debe enviar email para la notificación dada.
    """
    sql = text("""
        SELECT should_send_email
        FROM notifications 
        WHERE id = :notification_id
    """)
    
    engine = DBEngine.get_engine()
    
    try:
        async with engine.begin() as conn:
            result = await conn.execute(sql, {"notification_id": notification_id})
            row = result.fetchone()
            
            if row:
                return bool(row.should_send_email)
            return None  
            
    except Exception as e:
        logger.error(
            f"Error checking email setting for notification {notification_id}: {str(e)}", 
            exc_info=True,
            extra={"notification_id": notification_id}
        )
        return None

async def get_notifications_email_from_db() -> Optional[Tuple[str, str]]:

    """
    Obtiene el email y el código de idioma más reciente de la tabla notification_email_history.
    """
    sql = text("""
        SELECT email, language
        FROM email_notifications
        
       
    """)
    
    try:
        async with DBEngine.get_engine().begin() as conn:
            result = await conn.execute(sql)
            row = result.fetchone()
            
            if not row:
                logger.info("No notification email records found in database")
                return None
                
            email, lang_code = row.email, row.language
            
            # Validar formato del email
            if not EMAIL_REGEX.match(email):
                logger.error(f"Invalid notification email format: {email}")
                return None
                
            return email, lang_code
            
    except Exception as e:
        logger.error(
            f"Error while retrieving notification email: {str(e)}",
            exc_info=True
        )
        return None

async def get_users_for_notification(notification_id: int) -> list:
    result = db.execute("""
        SELECT DISTINCT u.id, u.language
        FROM users u
        JOIN user_roles ur ON u.id = ur.user_id
        JOIN role_permissions rp ON ur.role_id = rp.role_id
        WHERE rp.permission_id = :permission_id
          AND u.is_active = TRUE
    """, {"permission_id": permission_id})

    return [{"id": row[0], "language": row[1]} for row in result.fetchall()]
    
async def get_notification_template_from_db(notification_id: int, lang_code: str) -> Optional[dict]:
    """
    Obtiene la plantilla de notificación desde la base de datos
    
    Args:
        notification_id: ID de la notificación (ej: 5 para lista negra)
        lang_code: Código de idioma ('es' o 'en')
        
    Returns:
        dict: {'subject': str, 'template_text': str}
        None: Si no encuentra la plantilla o hay error
    """
    sql = text("""
        SELECT subject, template_text
        FROM notification_translations
        WHERE notification_id = :notification_id
        AND lang_code = :lang_code
        LIMIT 1
    """)
    
    try:
        async with DBEngine.get_engine().begin() as conn:
            result = await conn.execute(sql, {
                'notification_id': notification_id,
                'lang_code': lang_code
            })
            row = result.fetchone()
            
            if row:
                return {
                    'subject': row.subject,
                    'template_text': row.template_text
                }
            return None
            
    except Exception as e:
        logger.error(
            f"Error obteniendo plantilla para notificación {notification_id} en {lang_code}: {e}",
            exc_info=True
        )
        return None


async def get_templates_by_languages_from_db(notification_id: int, languages: List[str]) -> Dict[str, Dict[str, str]]:
    """
    Recupera el subject y template_text para un notification_id dado
    y una lista de códigos de idioma.

    Args:
        notification_id (int): ID de la notificación.
        languages (List[str]): Lista de códigos de idioma ('es', 'en', etc).

    Returns:
        Dict[str, Dict[str, str]]: 
            {
              "es": {"subject": "...", "template_text": "..."},
              "en": {"subject": "...", "template_text": "..."},
              ...
            }
    """
    if not languages:
        return {}

    placeholders = ", ".join([f":lang_{i}" for i in range(len(languages))])

    sql = text(f"""
        SELECT lang_code, subject, template_text
        FROM notification_translations
        WHERE notification_id = :notification_id
        AND lang_code IN ({placeholders})
    """)

    params = {"notification_id": notification_id}
    for i, lang in enumerate(languages):
        params[f"lang_{i}"] = lang

    try:
        async with DBEngine.get_engine().connect() as conn:
            result = await conn.execute(sql, params)
            rows = result.fetchall()

        return {
            row.lang_code: {
                "subject": row.subject,
                "template_text": row.template_text
            }
            for row in rows
        }

    except Exception as e:
        logger.error(f"Error obteniendo plantillas para notification_id={notification_id}: {e}", exc_info=True)
        return {}
    
async def insert_notification_event_in_db(
    notification_id: int,

    lang_code: str,
    formatted_message: str,
    created_at: datetime | None = None,
):
    sql = text("""
        INSERT INTO notification_events (
            notification_id, lang_code, formatted_message,  created_at
        ) VALUES (
            :notification_id,  :lang_code, :formatted_message, :created_at
        )
    """)

    params = {
        "notification_id": notification_id,
        "lang_code": lang_code,
        "formatted_message": formatted_message,
        "created_at": created_at if created_at else datetime.now(),
    }

    engine = DBEngine.get_engine()  # corregido indentación
    try:
        async with engine.begin() as conn:
            await conn.execute(sql, params)
        return True
    except Exception as e:
        logger.error(f"Error insertando evento de notificación: {e}", exc_info=True)
        return False
