import asyncio
from tasks.sessions import periodic_cleanup_job
from logger import logger  # Import your custom logger

async def periodic_event_dynamic_schedule(name: str, get_next_run_time, task_coro, check_interval=1):
    """
    Ejecuta `task_coro` cuando datetime.utcnow() >= get_next_run_time().
    """
    while True:
        now = datetime.utcnow()
        next_run = get_next_run_time()

        if now >= next_run:
            logger.info(f"Running event '{name}' at {now.isoformat()}")
            await task_coro()
        else:
            wait_time = (next_run - now).total_seconds()
            sleep_time = min(wait_time, check_interval)
            await asyncio.sleep(max(sleep_time, 0.1))




async def on_startup():

    asyncio.create_task(
        periodic_event_dynamic_schedule(
            "General Clean",
            get_next_cleanup_time,
            clean_expired,
            check_interval=1800 
        )
    )

