from db.db_engine import DBEngine  # Asegúrate que retorna AsyncEngine
from logger import logger
import random
from typing import Optional, Union
from sqlalchemy.sql import text
from fastapi import HTTPException, status

async def update_user_preferences_in_db(user_id: int, lang: str, theme: str) -> bool:
    engine = DBEngine.get_engine()
    sql = text("""
        UPDATE users 
        SET language = :lang, theme = :theme 
        WHERE id = :user_id
    """)

    try:
        async with engine.begin() as conn:
            result = await conn.execute(sql, {"lang": lang, "theme": theme, "user_id": user_id})
            if result.rowcount == 0:
                return False  # No se actualizó nada, usuario no encontrado
        return True
    except Exception as e:
        logger.error(f"Error updating user preferences: {e}")
        return False
    
async def get_user_id_from_db(session_id: str) -> int | None:
    try:
        engine = DBEngine.get_engine()
        async with engine.connect() as conn:
            result = await conn.execute(
                text("SELECT user_id FROM sessions WHERE session_id = :session_id "),
                {"session_id": session_id}
            )
            row = result.fetchone()
            if row:
                return row[0]  # user_id
    except Exception as e:
        logger.error(f"Error fetching user_id from session_id: {e}")
    
    return None

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


async def generate_unique_token_and_store_in_db(
    user_id: int,
    email: str,
    ip_address: str,
    user_agent: Optional[str] = None,
    ram_gb: Optional[Union[float, int]] = None,
    cpu_cores: Optional[int] = None,
    cpu_architecture: Optional[str] = None,
    gpu_info: Optional[str] = None,
    device_os: Optional[str] = None
    ) -> str:
    engine = DBEngine.get_engine()

    # Paso 1: Obtener tokens usados en los últimos 6 minutos
    select_sql = text("""
    SELECT token FROM email_verification_history
    WHERE requested_at >= (NOW() - INTERVAL 6 MINUTE)
    AND verified_at IS NOT NULL
""")

    try:
        async with engine.begin() as conn:
            result = await conn.execute(select_sql)
            recent_tokens = {row.token for row in result if row.token is not None}

            # Paso 2: Generar un token único de 6 dígitos
       
            new_token = None
            while True:
                candidate = f"{random.randint(0, 999999):06d}"  # token de 6 dígitos
                if candidate not in recent_tokens:
                    new_token = candidate
                    break
              
              
           
            # Paso 3: Insertar nuevo registro
            insert_sql = text("""
                INSERT INTO email_verification_history (
                    user_id, email, token, requested_at,
                    ip_address, user_agent, ram_gb,
                    cpu_cores, cpu_architecture, gpu_info, device_os
                )
                VALUES (
                    :user_id, :email, :token, NOW(),
                    :ip_address, :user_agent, :ram_gb,
                    :cpu_cores, :cpu_architecture, :gpu_info, :device_os
                )
            """)

            await conn.execute(insert_sql, {
                "user_id": user_id,
                "email": email,
                "token": new_token,
                "ip_address": ip_address,
                "user_agent": user_agent,
                "ram_gb": ram_gb,
                "cpu_cores": cpu_cores,
                "cpu_architecture": cpu_architecture,
                "gpu_info": gpu_info,
                "device_os": device_os
            })

            return new_token

    except Exception as e:
        logger.error(f"Error generating and saving token: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate and store verification token"
        )