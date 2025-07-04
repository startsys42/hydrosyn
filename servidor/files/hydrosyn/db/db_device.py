from datetime import datetime, timedelta
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from db.conexion import get_engine
from logger import logger  # Asegúrate de tenerlo configurado


def insert_login_attempts_to_db(
    user_id: int | None,
    ip_address: str,
    success: bool,
    user_agent: str | None = None,
    ram_gb: float | None = None,
    cpu_cores: int | None = None,
    cpu_architecture: str | None = None,
    gpu_info: str | None = None,
    device_os: str | None = None,
    recovery: bool = False
) -> bool:
     sql = text("""
        INSERT INTO login_attempts (
            user_id,
            ip_address,
            success,
            user_agent,
            ram_gb,
            cpu_cores,
            cpu_architecture,
            gpu_info,
            device_os,
            recovery
        ) VALUES (
            :user_id,
            :ip_address,
            :success,
            :user_agent,
            :ram_gb,
            :cpu_cores,
            :cpu_architecture,
            :gpu_info,
            :device_os,
            :recovery
        )
    """)
    
    params = {
        "user_id": user_id,
        "ip_address": ip_address,
        "success": success,
        "user_agent": user_agent,
        "ram_gb": ram_gb,
        "cpu_cores": cpu_cores,
        "cpu_architecture": cpu_architecture,
        "gpu_info": gpu_info,
        "device_os": device_os,
        "recovery": recovery
    }
    try:
        with get_engine().connect() as conn:
            result = conn.execute(sql, {"session_id": session_id})
            conn.commit()  # Commit the transaction
            if result.rowcount > 0:
                logger.info(f"Session deleted successfully. Session ID: {session_id}")
                return True
            else:
                logger.warning(f"No session found with Session ID: {session_id}")
                return False
    except Exception as e:
        logger.error(f"Error deleting session with Session ID {session_id}: {e}")
        return False
