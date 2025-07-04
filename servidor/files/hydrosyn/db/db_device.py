from datetime import datetime, timedelta
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from db.conexion import get_engine
from logger import logger  # Asegúrate de tenerlo configurado


def insert_login_attempts_to_db(session_id: str) -> bool:
    sql = text("""
        DELETE FROM sessions WHERE session_id = :session_id
    """)
    try:
        with get_engine().connect() as conn:
            result = conn.execute(sql, {"session_id": session_id})
            conn.commit()  # Commit the transaction
            if result.rowcount > 0:
                logger.info(f"Session deleted successfully. Session ID: {session_id}")
                return True
            else:
                logger.warning(f"No session found with Session ID: {session_id}")
                return False
    except Exception as e:
        logger.error(f"Error deleting session with Session ID {session_id}: {e}")
        return False
