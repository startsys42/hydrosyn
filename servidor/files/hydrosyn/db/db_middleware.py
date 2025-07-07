from sqlalchemy import text
from datetime import datetime, timedelta
from db.db_engine import DBEngine
from logger import logger

def get_cookie_expired_time_from_db() -> int:
    try:
        with DBEngine.get_engine().connect() as conn:
            result = conn.execute(
                text("SELECT  max_value FROM config WHERE id = 4")
            ).fetchone()

            if result:
                 max_val = result
                if max_val > 0:
                    return int(max_val)
                else:
                    logger.warning(f"Cookie expired time {max_val} error. Using default.")
    except Exception as e:
        logger.error(f"Error fetching cookie expired time : {e}")

 
    logger.info(f"Using default cookie  expired time: 30 days")
    return 30

def get_session_id_exists_from_db(session_id: str) -> bool:
    """
    Verifica si session_id existe en login_attempts o sessions.
    Devuelve True si existe, False si no.
    """
    try:
        with DBEngine.get_engine().connect() as conn:
            query_login = text("SELECT 1 FROM login_attempts WHERE session_id = :session_id LIMIT 1")
            if conn.execute(query_login, {"session_id": session_id}).fetchone():
                return True

            query_sessions = text("SELECT 1 FROM sessions WHERE session_id = :session_id LIMIT 1")
            if conn.execute(query_sessions, {"session_id": session_id}).fetchone():
                return True

    except Exception as e:
        logger.error(f"Error checking session_id existence: {e}")

    return False

def get_session_from_db(session_id: str, extend_validity: bool = True) -> dict:
    """
    Obtiene los datos de sesión desde la base de datos con opción de margen de validez
    
    Args:
        session_id: Identificador único de la sesión
        extend_validity: Si True, considera válidas sesiones que expiraron hace menos de 1 día
        
    Returns:
        dict: Datos de la sesión o None si no existe o está expirada
    """
    try:
        with DBEngine.get_engine().connect() as conn:
            # Consulta base con condición de expiración flexible
            query = text("""
                SELECT 
                    s.user_id, 
                    s.user_agent,
                    s.ram_gb,
                    s.cpu_cores,
                    s.cpu_architecture,
                    s. gpu_info,     
                    s.device_os,
                    s.summary,
                    s.created_at,
                    s.expires_at,
                    u.username,
                    u.email,
                    u.language 
                FROM sessions s
                JOIN users u ON s.user_id = u.id
                WHERE s.session_id = :session_id 
                AND s.expires_at > :validation_time
            """)
            
            # Determinar el tiempo de validación
            validation_time = datetime.utcnow()
            if extend_validity:
                validation_time = validation_time - timedelta(days=1)  # <- Cambio clave aquí
            
            result = conn.execute(
                query,
                {
                    'session_id': session_id,
                    'validation_time': validation_time
                }
            ).fetchone()

            if result:
                # Convertir resultado a diccionario
                columns = result.keys()
                session_data = {column: result[i] for i, column in enumerate(columns)}
                
                # Verificar si la sesión está técnicamente expirada pero dentro del margen
                if extend_validity and session_data['expires_at'] < datetime.utcnow():
                    logger.info(f"Session {session_id} is expired but within grace period")
                
                return session_data
            
            logger.warning(f"Session not found or expired: {session_id}")
            return None
            
    except Exception as e:
        logger.error(f"Error fetching session: {e}")
        return None

