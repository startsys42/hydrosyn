
import asyncio
from datetime import datetime, time, timedelta
from db.config import obtener_hora_limpieza_desde_bd
from db.conexion import get_engine
from sqlalchemy import text
from logger import logger



async def clean_general():

async def limpiar_sesiones_expiradas():
    ahora = datetime.utcnow()
    try:
        with get_engine().connect() as conn:
            result = conn.execute(
                text("DELETE FROM sessions WHERE expires_at < :ahora"),
                {"ahora": ahora}
            )
            logger.info(f"Sesiones expiradas eliminadas: {result.rowcount}")
    except Exception as e:
        logger.error(f"Error al limpiar sesiones expiradas: {e}")
async def periodic_cleanup_job():
    while True:
        hora_limpieza_int = int(obtener_hora_limpieza_desde_bd())  # Ej: 2 para las 2AM
        hora_limpieza = time(hour=hora_limpieza_int, minute=0, second=0)

        ahora_dt = datetime.utcnow()
        proxima_ejecucion_dt = ahora_dt.replace(hour=hora_limpieza.hour, minute=hora_limpieza.minute, second=hora_limpieza.second, microsecond=0)

        if ahora_dt >= proxima_ejecucion_dt:
            proxima_ejecucion_dt += timedelta(days=1)

        segundos_espera = (proxima_ejecucion_dt - ahora_dt).total_seconds()
        logger.info(f"Esperando {segundos_espera} segundos para la próxima limpieza de sesiones...")

        await asyncio.sleep(segundos_espera)

        await limpiar_sesiones_expiradas()
