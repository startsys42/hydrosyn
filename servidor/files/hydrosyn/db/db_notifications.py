

from typing import Optional
from sqlalchemy import text
from db.db_engine import DBEngine  # Asegúrate de importar tu DBEngine
from logger import logger

EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$')

async def get_should_send_email_for_notification_from_db(notification_id: int) -> bool:

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


async def get_latest_notification_email() -> Optional[Tuple[str, str]]:

    """
    sql = text("""
        SELECT email, lang_code
        FROM notification_email_history
        ORDER BY changed_at DESC
        LIMIT 1
    """)
    
    try:
        async with DBEngine.get_engine().begin() as conn:
            result = await conn.execute(sql)
            row = result.fetchone()
            
            if not row:
                logger.info("No hay registros de emails de notificación")
                return None
                
            email, lang_code = row.email, row.lang_code
            
            # Validar formato del email
            if not EMAIL_REGEX.match(email):
                logger.error(f"Email de notificación no válido: {email}")
                return None
                
            return email, lang_code
            
    except Exception as e:
        logger.error(
            f"Error al obtener email de notificación: {str(e)}",
            exc_info=True
        )
        return None
