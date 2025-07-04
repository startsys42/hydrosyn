
import secrets
import time
from typing import Tuple, Callable
from logger import logger  # si querés loguear


import math

def generate_secure_key(length: int = 128) -> str:
    n_bytes = math.ceil(length * 3 / 4)  # bytes needed for base64 length
    return secrets.token_urlsafe(n_bytes)[:length]  # trim if too long

class CookieKeyManager:
    def __init__(self, get_rotation_time: Callable[[], int], get_grace_period: Callable[[], int], ttl: int = 600):
        self.get_rotation_time = get_rotation_time
        self.get_grace_period = get_grace_period
        self.ttl = ttl  # minimum time between queries, in seconds
        self._cached_rotation_time = self.get_rotation_time()
        self._cached_grace_hour = self.get_grace_period()
        self._last_query = time.time()
        self.last_rotation = time.time()
        self.key_session_new = generate_secure_key()
        self.key_session_old = None
        self._next_cleanup_time = self._calculate_next_cleanup()  

    def _calculate_next_cleanup(self) -> float:
        now = time.localtime()
        grace_hour = self._cached_grace_hour
        
        # Si la hora de gracia de hoy ya pasó, programar para mañana
        if now.tm_hour >= grace_hour:
            next_day = time.mktime((
                now.tm_year, now.tm_mon, now.tm_mday + 1,
                grace_hour, 0, 0, 
                now.tm_wday, now.tm_yday, now.tm_isdst
            ))
            return next_day
        else:
            today = time.mktime((
                now.tm_year, now.tm_mon, now.tm_mday,
                grace_hour, 0, 0, 
                now.tm_wday, now.tm_yday, now.tm_isdst
            ))
            return today

    def get_keys(self) -> Tuple[str, str]:
        now = time.time()

        # If more than `ttl` seconds passed, update value from the database
        if now - self._last_query >= self.ttl:
            self._cached_rotation_time = self.get_rotation_time()
            new_grace_hour = self.get_grace_period()
            if new_grace_hour != self._cached_grace_hour:
                self._cached_grace_hour = new_grace_hour
                self._next_cleanup_time = self._calculate_next_cleanup()
            self._last_query = now

        # Is it time to rotate the key?
        if now - self.last_rotation >= self._cached_rotation_time:
            self.key_session_old = self.key_session_new
            self.key_session_new = generate_secure_key()
            self.last_rotation = now
            logger.info(f"Key cookie rotated at {time.ctime(now)}. Old key cookie will expire at {time.ctime(self._next_cleanup_time)}")

        # Borrar clave vieja si es la hora programada
        if self.key_session_old and self.key_session_old != self.key_session_new and now >= self._next_cleanup_time:
            logger.info(f"Cleaning old key cookie at scheduled time {time.ctime(now)}")
            self.key_session_old = None
        return self.key_session_new, (self.key_session_old if self.key_session_old else self.key_session_new)

class JWTKeyManager:             
    def __init__(self,   get_rotation_times: Callable[[], tuple[int, int]],get_grace_period: Callable[[], int], ttl: int = 600):
        self.get_rotation_time = get_rotation_time
        self.get_grace_period = get_grace_period
        self.ttl = ttl  # minimum time between queries, in seconds
        self._cached_rotation_time = self.get_rotation_time()[1]
        self._cached_grace_hour = self.get_grace_period()
        self._last_query = time.time()
        self.last_rotation = time.time()
        self.key_jwt_new = generate_secure_key()
        self.key_jwt_old = None
        self._next_cleanup_time = self._calculate_next_cleanup()  

    def _calculate_next_cleanup(self) -> float:
        now = time.localtime()
        grace_hour = self._cached_grace_hour
        
        # Si la hora de gracia de hoy ya pasó, programar para mañana
        if now.tm_hour >= grace_hour:
            next_day = time.mktime((
                now.tm_year, now.tm_mon, now.tm_mday + 1,
                grace_hour, 0, 0, 
                now.tm_wday, now.tm_yday, now.tm_isdst
            ))
            return next_day
        else:
            today = time.mktime((
                now.tm_year, now.tm_mon, now.tm_mday,
                grace_hour, 0, 0, 
                now.tm_wday, now.tm_yday, now.tm_isdst
            ))
            return today

    def get_keys(self) -> Tuple[str, str]:
        now = time.time()

        # If more than `ttl` seconds passed, update value from the database
        if now - self._last_query >= self.ttl:
            self._cached_rotation_time = self.get_rotation_time()[1]
            new_grace_hour = self.get_grace_period()
            if new_grace_hour != self._cached_grace_hour:
                self._cached_grace_hour = new_grace_hour
                self._next_cleanup_time = self._calculate_next_cleanup()
            self._last_query = now

        # Is it time to rotate the key?
        if now - self.last_rotation >= self._cached_rotation_time:
            self.key_jwt_old = self.key_jwt_new
            self.key_jwt_new = generate_secure_key()
            self.last_rotation = now
            logger.info(f"Key jwt rotated at {time.ctime(now)}. Old key jwt will expire at {time.ctime(self._next_cleanup_time)}")

        # Borrar clave vieja si es la hora programada
        if self.key_jwt_old and now >= self._next_cleanup_time:
            logger.info(f"Cleaning old key jwt at scheduled time {time.ctime(now)}")
            self.key_jwt_old = None

        return self.key_jwt_new, (self.key_jwt_old if self.key_jwt_old else self.key_jwt_new)
