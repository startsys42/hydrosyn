from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from engine import get_engine
from logger import logger

CLEANUP_HOUR_CONFIG_ID = 7
DEFAULT_CLEANUP_HOUR = 2

def get_cleanup_hour_from_db():
    try:
        engine = get_engine()
        with engine.connect() as conn:
            result = conn.execute(
                text("SELECT value, min_value, max_value FROM config WHERE id = :id"),
                {"id": CLEANUP_HOUR_CONFIG_ID}
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

