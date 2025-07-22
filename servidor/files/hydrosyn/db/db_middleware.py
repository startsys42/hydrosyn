from sqlalchemy import text

from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from typing import Literal
from datetime import datetime, timedelta
from db.db_engine import DBEngine
from logger import logger

async def insert_login_attempts_in_db(
    session_id: str, 
    user_id: int | None,
    ip_address: str,
    success: bool,
    page: str, 
    http_method: Literal['GET', 'POST'],
    attempt_time: datetime | None = None,
    user_agent: str | None = None,
    ram_gb: int | float | None = None,
    cpu_cores: int | None = None,
    cpu_architecture: str | None = None,
    gpu_info: str | None = None,
    device_os: str | None = None,
    recovery: bool = False,
   
    
) -> bool:
    sql = text("""
        INSERT INTO login_attempts (
            user_id,
            session_id,
            ip_address,
            success,
            user_agent,
            ram_gb,
            cpu_cores,
            cpu_architecture,
            gpu_info,
            device_os,
            recovery,
            page,              
            http_method,
            attempt_time
        ) VALUES (
            :user_id,
            :session_id,
            :ip_address,
            :success,
            :user_agent,
            :ram_gb,
            :cpu_cores,
            :cpu_architecture,
            :gpu_info,
            :device_os,
            :recovery,
            :page,              
            :http_method,
            :attempt_time
        )
    """)
    
    params = {
        "session_id":session_id,
        "user_id": user_id,
        "ip_address": ip_address,
        "success": success,
        "user_agent": user_agent,
        "ram_gb": float(ram_gb) if ram_gb is not None else None, 
        "cpu_cores": cpu_cores,
        "cpu_architecture": cpu_architecture,
        "gpu_info": gpu_info,
        "device_os": device_os,
        "recovery": recovery,
        "page": page,                     
        "http_method": http_method.upper(),
        "attempt_time": attempt_time
    }
    try:
        engine = DBEngine.get_engine()
        async with engine.begin() as conn:
            result = await conn.execute(sql, params)
            
            if result.rowcount == 1:
                logger.info(f"Login attempt recorded successfully for IP: {ip_address}")
                return True
            else:
                logger.warning(f"Login attempt not recorded for IP: {ip_address}")
                return False
                
    except SQLAlchemyError as e:
        logger.error(f"Database error recording login attempt: {str(e)}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error recording login attempt: {str(e)}")
        return False




async def get_cookie_expired_time_from_db() -> int:
    try:
        async with DBEngine.get_engine().connect() as conn:
            result = await conn.execute(
                text("SELECT max_value FROM config WHERE id = 4")
            )
            row = result.fetchone()  # Sin await
            
            if row and row.max_value is not None and row.max_value > 0:
                return int(row.max_value)
            
            logger.warning("Cookie expired time not found or invalid. Using default.")
    except Exception as e:
        logger.error(f"Error fetching cookie expired time: {e}")
    
    logger.info("Using default cookie expired time: 30 days")
    return 30
    

async def get_session_id_exists_from_db(session_id: str) -> bool:
    try:
        async with DBEngine.get_engine().begin() as conn:  # begin() maneja transacción
            # Verificar en login_attempts
            result = await conn.execute(
                text("SELECT 1 FROM login_attempts WHERE session_id = :session_id LIMIT 1"),
                {"session_id": session_id}
            )
            if result.fetchone():
                return True

            # Verificar en sessions
            result = await conn.execute(
                text("SELECT 1 FROM sessions WHERE session_id = :session_id LIMIT 1"), 
                {"session_id": session_id}
            )
            return result.fetchone() is not None

    except Exception as e:
        logger.error(f"Error checking session_id existence: {e}")
        return False

async def get_session_from_db(session_id: str, extend_validity: bool = True) -> dict | None:
    """
    Obtiene los datos de sesión desde la base de datos con opción de margen de validez
    
    Args:
        session_id: Identificador único de la sesión
        extend_validity: Si True, considera válidas sesiones que expiraron hace menos de 1 día
        
    Returns:
        dict: Datos de la sesión o None si no existe o está expirada
    """
    try:
        async with DBEngine.get_engine().connect() as conn:
            # Consulta base con condición de expiración flexible
            query = text("""
                SELECT 
                    s.user_id, 
                    s.user_agent,
                    s.ram_gb,
                    s.cpu_cores,
                    s.cpu_architecture,
                    s.gpu_info,     
                    s.device_os,
                    s.summary,
                    s.created_at,
                    u.username,
                    u.email,
                    u.is_active,
                    u.first_login,
                    u.change_pass,
                    u.use_2fa,
                    u.language,
                    u.theme
                FROM sessions s
                JOIN users u ON s.user_id = u.id
                WHERE s.session_id = :session_id 
                AND s.expires_at > :validation_time
            """)
            
            # Determinar el tiempo de validación
            validation_time = datetime.utcnow()
            if extend_validity:
                validation_time = validation_time - timedelta(days=1)  # <- Cambio clave aquí
            
            result = await conn.execute(query, {
                'session_id': session_id,
                'validation_time': validation_time
            })
            row =  result.fetchone()

            if row:
                # Convertir resultado a diccionario
                columns = row.keys()
                session_data = {column: row[i] for i, column in enumerate(columns)}
                
                
                
                return session_data
            
            logger.warning(f"Session not found or expired: {session_id}")
            return None
            
    except Exception as e:
        logger.error(f"Error fetching session: {e}")
        return None

