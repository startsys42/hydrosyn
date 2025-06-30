import asyncio
from tasks.sessions import periodic_cleanup_job
from logger import logger  # Import your custom logger

async def on_startup():
    logger.info("The application is starting up...")
    # Launch the periodic job in the background
    asyncio.create_task(periodic_cleanup_job())
