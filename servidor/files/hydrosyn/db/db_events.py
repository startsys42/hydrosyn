from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from bd.db_engine import DBEngine 
from logger import logger

DEFAULT_CLEANUP_HOUR = 2

async def get_cleanup_hour_from_db() -> int:
    try:
        engine = DBEngine.get_engine()
        async with engine.connect() as conn:
            result = await conn.execute(
                text("SELECT value, min_value, max_value FROM config WHERE id = 2")
            )
            row = result.fetchone()
            if row:
                value, min_val, max_val = row
                if min_val <= value <= max_val and 0 <= value <= 23:
                    return int(value)
                else:
                    logger.warning(
                        f"Cleanup hour {value} out of range ({min_val}-{max_val} or 0-23). Using default {DEFAULT_CLEANUP_HOUR}"
                    )
                    return DEFAULT_CLEANUP_HOUR
            else:
                logger.warning("No config entry found for cleanup hour. Using default.")
                return DEFAULT_CLEANUP_HOUR
    except SQLAlchemyError as e:
        logger.error(f"Database error while fetching cleanup hour: {e}")
        return DEFAULT_CLEANUP_HOUR
    except Exception as e:
        logger.exception(f"Unexpected error while fetching cleanup hour: {e}")
        return DEFAULT_CLEANUP_HOUR


    
    

