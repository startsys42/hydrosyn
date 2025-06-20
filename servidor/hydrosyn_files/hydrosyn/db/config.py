from sqlalchemy import text
from db.conexion import get_engine
from logger import logger

def obtener_tiempo_rotacion_desde_bd() -> int:
    try:
        with get_engine().connect() as conn:
            result = conn.execute(
                text("SELECT value FROM config WHERE id = 3")
            ).fetchone()
            if result and result[0] is not None:
                try:
                    dias = int(result[0])
                    segundos = dias * 86400
                   
                    return segundos
                except (ValueError, TypeError):
                    logger.warning(f"Valor inválido para tiempo de rotación: {result[0]}")
    except Exception as e:
        logger.error(f"Error al obtener tiempo de rotación desde BD: {e}")

    # Valor por defecto si falla algo
    default_ttl = 86400
    logger.info(f"Usando valor por defecto para tiempo de rotación: {default_ttl} segundos")
    return default_ttl

def obtener_hora_limpieza_desde_bd() -> int:
    try:
        with get_engine().connect() as conn:
            result = conn.execute(
                text("SELECT value FROM config WHERE id = 6")
            ).fetchone()
            if result:
                try:
                    hora = int(result[0])
                    if 0 <= hora <= 23:
                        return hora
                    else:
                        logger.warning(f"Hora de limpieza fuera de rango: {hora}")
                except ValueError:
                    logger.warning(f"Valor de hora de limpieza no es un entero: {result[0]}")
    except Exception as e:
        logger.error(f"Error al obtener hora de limpieza desde BD: {e}")

    # Valor por defecto
    return 2
Dónde ponerlo:
