from sqlalchemy import text
from db.db_engine import DBEngine  # changed import
from logger import logger

def get_cookie_rotation_time_from_db() -> int:
    try:
        with DBEngine.get_engine().connect() as conn:  # using class method
            result = conn.execute(
                text("SELECT value, min_value, max_value FROM config WHERE id = 4")
            ).fetchone()
            if result and result[0] is not None:
                try:
                    days = int(result[0])
                    seconds = days * 86400
                    return seconds
                except (ValueError, TypeError):
                    logger.warning(f"Invalid value for rotation time: {result[0]}")
    except Exception as e:
        logger.error(f"Error fetching rotation time from DB: {e}")

    default_ttl = 86400
    logger.info(f"Using default rotation time: {default_ttl} seconds")
    return default_ttl


def get_jwt_rotation_time_from_db() -> int:
    try:
        with DBEngine.get_engine().connect() as conn:  # using class method
            result = conn.execute(
                   text("SELECT id, value FROM config WHERE id IN (5,6)")
            ).fetchall()
            if result and result[0] is not None:
                try:
                    days = int(result[0])
                    seconds = days * 86400
                    return seconds
                except (ValueError, TypeError):
                    logger.warning(f"Invalid value for rotation time: {result[0]}")
    except Exception as e:
        logger.error(f"Error fetching rotation time from DB: {e}")

    default_ttl = 86400
    logger.info(f"Using default rotation time: {default_ttl} seconds")
    return default_ttl
 
