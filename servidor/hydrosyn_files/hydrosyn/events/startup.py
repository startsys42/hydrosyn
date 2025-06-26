import asyncio
from tasks.sessions import periodic_cleanup_job
from logger import logger  # Importa tu logger personalizado

async def on_startup():
    logger.info("La aplicación está arrancando...")
    # Lanzar el job periódico en segundo plano
    asyncio.create_task(periodic_cleanup_job())
