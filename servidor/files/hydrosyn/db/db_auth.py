from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection
from db.db_engine import DBEngine  # Asegúrate que retorna AsyncEngine
from logger import logger
from datetime import datetime, timedelta
from db.db_config import get_cookie_rotation_time_from_db

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
                logger.info(f"Session deleted successfully. Session ID: {session_id}")
                return True
            else:
                logger.warning(f"No session found with Session ID: {session_id}")
                return False
    except Exception as e:
        logger.error(f"Error deleting session with Session ID {session_id}: {e}")
        return False

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

def guardar_sesion_en_bd(user_id: int, session_id: str, clave: str, user_agent: str, ip: str):
    segundos_validez = get_cookie_rotation_time_from_db()
    expires_at = datetime.utcnow() + timedelta(seconds=segundos_validez)

    try:
        with get_engine().connect() as conn:
            conn.execute(
            text("DELETE FROM sessions WHERE user_id = :user_id AND session_id != :session_id"),
            {"user_id": user_id, "session_id": session_id}
        )
            conn.execute(
                text("""
                    INSERT INTO sessions (user_id, session_id, session_key , user_agent, ip, expires_at)
                    VALUES (:user_id, :session_id, :clave, :user_agent, :ip, :expires_at)
                """),
                {
                    "user_id": user_id,
                    "session_id": session_id,
                    "clave": clave,
                    "user_agent": user_agent[:512],
                    "ip": ip,
                    "expires_at": expires_at
                }
            )
            logger.info(f"Sesión guardada para el usuario {user_id}, IP {ip}")
    except IntegrityError as e:
        logger.error(f"Error de integridad al guardar sesión: {e}")
        # Puedes lanzar un error controlado o notificar
    except SQLAlchemyError as e:
        logger.error(f"Error en la base de datos al guardar sesión: {e}")
        # También puedes lanzar un error o retornar un código HTTP si es una API
    except Exception as e:
        logger.exception(f"Error inesperado al guardar sesión: {e}")
