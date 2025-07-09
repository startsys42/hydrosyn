import asyncio
from datetime import datetime, time, timedelta
from logger import logger  # Import your custom logger
from events.tasks import *
from security.keys_managers import cookie_key_manager, jwt_key_manager

async def get_next_cleanup_time():
    now = datetime.utcnow()
    cleanup_hour = await get_old_cookie_token_limit_hour_from_db()
    scheduled_time_today = datetime.combine(now.date(), time(cleanup_hour, 0))

    if now >= scheduled_time_today:
        next_run = scheduled_time_today + timedelta(days=1)
    else:
        next_run = scheduled_time_today

    return next_run


 

async def periodic_event_dynamic_schedule(name: str, get_next_run_time, task_coro, check_interval: int = 1800):
 while True:
        now = datetime.utcnow()
        try:
            next_run = await get_next_run_time()
        except Exception as e:
            logger.exception(f"Error getting next run time for '{name}': {e}")
            next_run = now + timedelta(seconds=check_interval)

        if now >= next_run:
            logger.info(f"Running periodic task '{name}' at {now.isoformat()}")
            try:
                await task_coro()
            except Exception as e:
                logger.exception(f"Error running task '{name}': {e}")
        else:
            wait_time = (next_run - now).total_seconds()
            sleep_time = min(wait_time, check_interval)
            await asyncio.sleep(max(sleep_time, 0.1))


async def on_startup():
    await cookie_key_manager.initialize()
    await jwt_key_manager.initialize()
    asyncio.create_task(
        periodic_event_dynamic_schedule(
            name="General Clean",
            get_next_run_time=get_next_cleanup_time,
            task_coro=general_clean,
            check_interval=1800  # 30 minutes
        )
    )

