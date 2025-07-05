from datetime import datetime, timedelta
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from logger import logger  
from bd.db_engine import DBEngine 





def insert_login_attempts_to_db(
    user_id: int | None,
    ip_address: str,
    success: bool,
    user_agent: str | None = None,
    ram_gb: int | float | None = None,
    cpu_cores: int | None = None,
    cpu_architecture: str | None = None,
    gpu_info: str | None = None,
    device_os: str | None = None,
    recovery: bool = False,
    page: str, 
    http_method: Literal['GET', 'POST']
    
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
            :recovery,
            :page,              
            :http_method  
        )
    """)
    
    params = {
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
        "http_method": http_method.upper()
    }
    try:
        engine = DBEngine.get_engine()
        with engine.connect() as conn:
            result = conn.execute(sql, params)
            conn.commit()
            
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
