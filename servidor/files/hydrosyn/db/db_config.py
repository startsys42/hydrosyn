from sqlalchemy import text
from db.db_engine import DBEngine  # changed import
from logger import logger

DEFAULT_HOUR_ROTATION = 2

async def get_cookie_rotation_time_from_db() -> int:
    try:
        engine = DBEngine.get_engine()
        async with engine.connect() as conn:
            result = await conn.execute(
                text("SELECT value, min_value, max_value FROM config WHERE id = 4")
            )
            row = await result.fetchone()

            if row:
                value, min_val, max_val = row
                if min_val <= value <= max_val and value > 0:
                    return int(value * 86400)
                else:
                    logger.warning(f"Cookie rotation {value} out of range ({min_val}-{max_val}) days. Using default.")
    except Exception as e:
        logger.error(f"Error fetching cookie rotation time: {e}")

    logger.info(f"Using default cookie rotation time: 1 day")
    return 86400

async def get_old_cookie_token_limit_hour_from_db() -> int:
    try:
        engine = DBEngine.get_engine()
        async with engine.connect() as conn:
            result = await conn.execute(
                text("SELECT value, min_value, max_value FROM config WHERE id = 7")
            )
            row = await result.fetchone()

            if row:
                value, min_val, max_val = row
                if min_val <= value <= max_val and value > 0:
                    return int(value)
                else:
                    logger.warning(f"Old cookie/token rotation limit {value} out of range ({min_val}-{max_val}). Using default.")
    except Exception as e:
        logger.error(f"Error fetching old cookie/token rotation time limit: {e}")

    logger.info(f"Using default old cookie/token rotation time limit")
    return DEFAULT_HOUR_ROTATION

async def get_jwt_rotation_time_from_db() -> tuple[int, int]:
    default_access_ttl = 3600  # 1 hour 
    default_refresh_ttl = 7 * 86400  # 7 days

    try:
        engine = DBEngine.get_engine()
        async with engine.connect() as conn:
            result = await conn.execute(
                text("SELECT id, value, min_value, max_value FROM config WHERE id IN (5, 6)")
            )
            rows = await result.fetchall()

            access_ttl = default_access_ttl
            refresh_ttl = default_refresh_ttl

            for row in rows:
                config_id, value, min_val, max_val = row
                if min_val <= value <= max_val and value > 0:
                    if config_id == 5:  # Tiempo de acceso (en minutos)
                        access_ttl = int(value * 60)
                    elif config_id == 6:  # Tiempo de refresco (en días)
                        refresh_ttl = int(value * 86400)
                else:
                    logger.warning(
                        f"JWT rotation time (ID {config_id}) out of range ({min_val}-{max_val}): {value}. "
                        "Using default."
                    )

            return access_ttl, refresh_ttl

    except Exception as e:
        logger.error(f"Error fetching JWT rotation times: {e}")
        return default_access_ttl, default_refresh_ttl
    

       

 
