
import asyncio
from datetime import datetime, time, timedelta
from db.db_config import get_old_cookie_token_limit_hour_from_db
from db.db_engine import DBEngine
from sqlalchemy import text
from logger import logger



async def general_clean():
    clean_hour = int(get_old_cookie_token_limit_hour_from_db()) 
    clean_hour = time(hour=clean_hour, minute=0, second=0)
   # if datetime.utcnow() >= clean_hour:
        


