from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection
from db.db_engine import DBEngine  # Asegúrate que retorna AsyncEngine
from logger import logger
from datetime import datetime, timedelta


from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError



from typing import Optional, Dict, Any


async def get_user_login_from_db(username: str) -> Optional[Dict[str, Any]]:
    sql = text("""
        SELECT id, username, email, is_active, password,language
        FROM users 
        WHERE username = :username
        LIMIT 1
    """)
    params = {"username": username}
    
    try:
        engine = DBEngine.get_engine()
        async with engine.begin() as conn:  # begin() para transacciones
            result = await conn.execute(sql, params)
            if (user := result.mappings().first()):
              
                return dict(user)
            return None
            
    except SQLAlchemyError as e:
        logger.error(
           
            f"SQLAlchemy error: {str(e)}",
            exc_info=True
        )
    except Exception as e:
        logger.error(
            f"Unexpected error fetching user {username}: {str(e)}",
            exc_info=True
        )
    return None


async def update_2fa_code_in_db(user_id: int, code: str) -> bool:
    sql = text("""
        UPDATE users SET code_2fa = :code
        WHERE user_id = :user_id
    """)
    params = {
        "user_id": user_id,
        "code": code,
    
    }
    
    try:
        engine = DBEngine.get_engine()
        async with engine.begin() as conn:
            await conn.execute(sql, params)
            
            return True
            
    except SQLAlchemyError as e:
        logger.error(f"SQLAlchemy error inserting 2FA code: {str(e)}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error inserting 2FA code: {str(e)}")
        return False


async def get_user_recovery_password_from_db(username: str, email: str) -> Optional[Dict[str, Any]]:
    sql = text("""
        SELECT id, username, email, is_active, password,language
        FROM users 
        WHERE username = :username AND email = :email
        LIMIT 1
    """)
    params = {"username": username, "email": email}

    try:
        engine = DBEngine.get_engine()
        async with engine.begin() as conn:
            result = await conn.execute(sql, params)
            if (user := result.mappings().first()):
                return dict(user)
            return None

    except SQLAlchemyError as e:
        logger.error(
            f"SQLAlchemy error: {str(e)}",
            exc_info=True
        )
    except Exception as e:
        logger.error(
            f"Unexpected error fetching user {username}: {str(e)}",
            exc_info=True
        )
    return None


async def update_password_in_db(user_id: int, hashed_password: str) -> bool:
    sql = text("""
        UPDATE users SET password = :password
        WHERE id = :user_id
    """)
    params = {
        "user_id": user_id,
        "password": hashed_password
    }

    try:
        engine = DBEngine.get_engine()
        async with engine.begin() as conn:
            await conn.execute(sql, params)
            return True
    except SQLAlchemyError as e:
        logger.error(f"SQLAlchemy error updating password: {str(e)}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error updating password: {str(e)}")
        return False

async def get_code_2fa_from_db(user_id: int, code: str) -> bool:
    verify_sql = text("""
        SELECT 1 FROM users WHERE id = :user_id AND code_2fa = :code
    """)
    
    # Consulta para invalidar el código (setear a NULL)
    invalidate_sql = text("""
        UPDATE users SET code_2fa = NULL WHERE id = :user_id
    """)
    
    params = {"user_id": user_id, "code": code}

    try:
        engine = DBEngine.get_engine()
        async with engine.begin() as conn:
            # 1. Verificar si el código es válido
            result = await conn.execute(verify_sql, params)
            is_valid = result.scalar() is not None
            
            # 2. Si es válido, invalidarlo (setear a NULL)
            if is_valid:
                await conn.execute(invalidate_sql, {"user_id": user_id})
            
            return is_valid
            
    except SQLAlchemyError as e:
        logger.error(f"SQLAlchemy error in 2FA code verification: {str(e)}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error in 2FA code verification: {str(e)}")
        return False
    
async def delete_old_session_in_db(user_id: int) -> bool:
    sql = text("""
        DELETE FROM sessions WHERE user_id = :user_id
    """)
    engine = DBEngine.get_engine()
    try:
        async with engine.connect() as conn:  # obtener conexión async
            async with conn.begin():  # transacción explícita async
                result = await conn.execute(sql, {"user_id": user_id})
            if result.rowcount > 0:
                return True
            else:
                logger.warning(f"No session found for User ID: {user_id}")
                return False
    except Exception as e:
        logger.error(f"Error deleting session for User ID {user_id}: {e}")
        return False

async def get_user_by_username(username: str) -> Optional[dict]:
    """
    Retrieve essential user data by username from the database
    
    Args:
        username: The username to search for
        
    Returns:
        dict: Contains only essential user fields if found
              {
                  "id": int,
                  "username": str,
                  "email": str,
                  "is_active": bool,
                  "language": str,
                  "theme": str,
                  "use_2fa": bool
              }
        None: If user not found or error occurs
    """
    sql = text("""
        SELECT 
            id,
            username,
            email,
            is_active,
            language,
            theme,
            use_2fa
        FROM users 
        WHERE username = :username
    """)
    
    engine = DBEngine.get_engine()
    
    try:
        async with engine.begin() as conn:
            result = await conn.execute(sql, {"username": username})
            row = result.fetchone()
            
            if row:
                return {
                    "id": row.id,
                    "username": row.username,
                    "email": row.email,
                    "is_active": row.is_active,
                    "language": row.language,
                    "theme": row.theme,
                    "use_2fa": row.use_2fa
                }
            return None
            
    except Exception as e:
        logger.error(
            f"Error fetching user {username}: {str(e)}", 
            exc_info=True,
            extra={"username": username}
        )
        return None


async def email_exist(email: str) -> bool:
    sql = text("""
        SELECT 1 FROM users WHERE email = :email LIMIT 1
    """)
    engine = DBEngine.get_engine()
    try:
        async with engine.connect() as conn:
            result = await conn.execute(sql, {"email": email})
            row = result.fetchone()
            return row is not None
    except Exception as e:
        logger.error(f"Error checking email existence: {e}")
        return False  # o True si quieres bloquear en caso de error


async def get_admin_from_db(user_id: str) -> bool:
    sql = text("""
        SELECT * FROM user_roles WHERE user_id = :user_id and role_id=1 LIMIT 1
    """)
    engine = DBEngine.get_engine()
    try:
        async with engine.connect() as conn:
            result = await conn.execute(sql, {"user_id": user_id})
            row = result.fetchone()
            return row is not None 
    except Exception as e:
        logger.error(f"Error checking admin existence: {e}")
        return False  # o True si quieres bloquear en caso de error




def get_user_state(username: str) -> str:
    sql = text("""
        SELECT 
            u.id,
            u.is_active,
            u.lockout_until,
            u.failed_login_attempts,
            u.use_2fa,
            ev.verified,
            ev.expires_at
        FROM users u
        LEFT JOIN email_verifications ev ON ev.user_id = u.id
        WHERE u.username = :username
        LIMIT 1
    """)

    with get_engine().connect() as conn:
        result = conn.execute(sql, {"username": username}).fetchone()

        if not result:
            return "NON_EXISTENT"  # Usuario no encontrado

        # Extraemos valores
        is_active = result["is_active"]
        lockout_until = result["lockout_until"]
        failed_attempts = result["failed_login_attempts"]
        use_2fa = result["use_2fa"]
        verified = result["verified"]
        expires_at = result["expires_at"]

        
        if lockout_until and lockout_until > datetime.utcnow():
            return "LOCKED"
        if not is_active:
            # Está en email_verifications pero no verificado
            if verified == 0 and expires_at and expires_at > datetime.utcnow():
                return "NEEDS_VERIFICATION"
            elif verified == 0 and expires_at and expires_at <= datetime.utcnow():
                return "NON_EXISTENT"
            else:
                return "INACTIVE"

       

        if use_2fa:
            return "2FA_REQUIRED"
        else:
            return "NO_2FA"

async def insert_new_session_in_db(
    user_id: int,
    session_id: str,
    user_agent: str,
    ram_gb: float,
    cpu_cores: int,
    gpu_info: str,
    device_os: str,
    summary: str
) -> bool:
    sql = text("""
        INSERT INTO sessions (user_id, session_id, user_agent, ram_gb, cpu_cores, gpu_info, device_os, summary)
        VALUES (:user_id, :session_id, :user_agent, :ram_gb, :cpu_cores, :gpu_info, :device_os, :summary)
    """)
    engine = DBEngine.get_engine()
    try:
        async with engine.connect() as conn:
            await conn.execute(sql, {
                "user_id": user_id,
                "session_id": session_id,
                "user_agent": user_agent,
                "ram_gb": ram_gb,
                "cpu_cores": cpu_cores,
                "gpu_info": gpu_info,
                "device_os": device_os,
                "summary": summary
            })
            return True
    except Exception as e:
        logger.error(f"Error inserting new session: {e}")
        return False

