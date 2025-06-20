from datetime import datetime, timedelta
from sqlalchemy import text
from db.conexion import get_engine

def guardar_sesion_en_bd(
    user_id: int,
    session_id: str,
    clave: str,
    user_agent: str,
    ip: str,
    max_age: int  # En segundos
):
    expires_at = datetime.utcnow() + timedelta(seconds=max_age)

    with get_engine().connect() as conn:
        conn.execute(
            text("""
            INSERT INTO sessions (user_id, session_id, key, user_agent, ip, expires_at)
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
