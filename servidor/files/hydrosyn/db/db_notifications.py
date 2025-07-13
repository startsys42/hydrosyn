

from typing import Optional
from sqlalchemy import text
from db.db_engine import DBEngine  # Asegúrate de importar tu DBEngine
from logger import logger
async def should_send_email_for_notification(notification_id: int) -> bool:

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
