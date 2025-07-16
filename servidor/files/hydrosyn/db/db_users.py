from db.db_engine import DBEngine  # Asegúrate que retorna AsyncEngine
from logger import logger

async def reset_change_pass_to_null_in_db(username: str) -> dict:
    engine = DBEngine.get_engine()
    sql = text("UPDATE users SET change_pass = NULL WHERE username = :username")

    try:
        async with engine.begin() as conn:
            result = await conn.execute(sql, {"username": username})
            if result.rowcount == 0:
                return {"success": False, "message": f"User '{username}' not found."}
        return {"success": True, "message": f"'change_pass' reset to NULL for user '{username}'."}
    except Exception as e:
        logger.error(f"Database error (set NULL): {e}")
        return {"success": False, "message": "Database error while resetting change_pass."}


# Function 2: Set change_pass = NOW()
async def set_change_pass_to_now_in_db(username: str) -> dict:
    engine = DBEngine.get_engine()
    sql = text("UPDATE users SET change_pass = NOW() WHERE username = :username")

    try:
        async with engine.begin() as conn:
            result = await conn.execute(sql, {"username": username})
            if result.rowcount == 0:
                return {"success": False, "message": f"User '{username}' not found."}
        return {"success": True, "message": f"'change_pass' set to current timestamp for user '{username}'."}
    except Exception as e:
        logger.error(f"Database error (set NOW): {e}")
        return {"success": False, "message": "Database error while updating change_pass."}
    
    
async def is_in_blacklist_from_db(username: str) -> bool:
    sql = text("""
        SELECT username FROM username_blacklist WHERE username = :username 
    """)
    engine = DBEngine.get_engine()
    
    try:
        async with engine.begin() as conn:  # Usamos begin() para manejo automático de transacciones
            result = await conn.execute(sql, {"username": username})
            row = result.fetchone()
            return row is not None  # Corrección: devuelve bool en lugar del objeto row
            
    except Exception as e:
        logger.error(f"Error checking blacklist for {username}: {str(e)}", 
                   exc_info=True,  # Registra el stack trace completo
                   extra={"username": username})
        return True  # Fail-safe
    

async def delete_session_in_db(session_id: str) -> bool:
    sql = text("""
        DELETE FROM sessions WHERE session_id = :session_id
    """)
    engine = DBEngine.get_engine()
    try:
        async with engine.connect() as conn:  # obtener conexión async
            async with conn.begin():  # transacción explícita async
                result = await conn.execute(sql, {"session_id": session_id})
            if result.rowcount > 0:
                return True
            else:
                logger.warning(f"No session found with Session ID: {session_id}")
                return False
    except Exception as e:
        logger.error(f"Error deleting session with Session ID {session_id}: {e}")
        return False

