from sqlalchemy import create_engine, text
from db.conexion import get_engine
def obtener_tiempo_rotacion_desde_bd() -> int:
    with get_engine().connect() as conn:
        result = conn.execute(
            text("SELECT valor FROM configuracion WHERE clave = 'tiempo_rotacion_sesiones'")
        ).fetchone()
        if result:
            return int(result[0]) * 86400
        return 3600  # valor por defecto
