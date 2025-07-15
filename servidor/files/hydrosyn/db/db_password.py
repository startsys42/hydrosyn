from sqlalchemy import text
from db.db_engine import DBEngine
from logger import logger

async def get_special_chars_from_db() -> list[str]:
    sql = text("SELECT special_char FROM password_special_chars")
    engine = DBEngine.get_engine()
    
    try:
        async with engine.begin() as conn:
            result = await conn.execute(sql)
            rows = result.fetchall()
            return [row[0] for row in rows]
    except Exception as e:
        logger.error(f"Error fetching special chars: {e}", exc_info=True)
        return []  # Devuelve lista vacía como fallback

async def get_password_policy_from_db() -> dict:
    sql = text("SELECT * FROM password_policy_current ORDER BY changed_at DESC LIMIT 1")
    engine = DBEngine.get_engine()

    try:
        async with engine.begin() as conn:
            result = await conn.execute(sql)
            row = result.fetchone()
            if not row:
                raise Exception("No password policy found")
            return dict(row._mapping)  # Para obtener un dict con los datos
    except Exception as e:
        logger.error(f"Error getting password policy: {e}", exc_info=True)
        raise