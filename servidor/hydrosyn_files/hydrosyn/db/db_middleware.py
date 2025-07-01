from sqlalchemy import text
from datetime import datetime, timedelta
from db.db_engine import DBEngine
from logger import logger

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
                    s.session_key, 
                    s.user_agent,
                    s.ram_gb,
                    s.cpu_cores,
                    s.cpu_architecture,
                    s.gpu_vendor,
                    s.gpu_model,
                    s.device_os,
                    s.created_at,
                    s.expires_at,
                    u.username,
                    u.email
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

