from datetime import datetime, timedelta
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from db.conexion import get_engine
from logger import logger  # Asegúrate de tenerlo configurado
from db.config import obtener_tiempo_rotacion_desde_bd

def guardar_sesion_en_bd(user_id: int, session_id: str, clave: str, user_agent: str, ip: str):
    segundos_validez = obtener_tiempo_rotacion_desde_bd()
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
