
import asyncio
from datetime import datetime, time, timedelta
from db.DB_config import get_old_cookie_token_limit_hour_from_db
from db.conexion import get_engine
from sqlalchemy import text
from logger import logger



async def clean_general():
    clean_hour = int(get_old_cookie_token_limit_hour_from_db()) 
    clean_hour = time(hour=clean_hour, minute=0, second=0)
   # if datetime.utcnow() >= clean_hour:
        


