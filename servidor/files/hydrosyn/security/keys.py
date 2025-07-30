
from typing import Tuple
from datetime import datetime, timedelta
import math
import secrets
from logger import logger
import time


def generate_secure_key(length: int = 128) -> str:
    n_bytes = math.ceil(length * 3 / 4)
    return secrets.token_urlsafe(n_bytes)[:length]

class CookieKeyManager:
    def __init__(self, rotation_time: int, grace_period: int, ttl: int = 600):
        self.rotation_time = rotation_time
        self.grace_period = grace_period
        self.ttl = ttl
        self._last_query = 0
        self.last_rotation = 0
        self.key_session_new = generate_secure_key()
        self.key_session_old = None
        self._cached_rotation_time = None
        self._cached_grace_hour = None
        self._next_cleanup_time = None

    async def initialize(self):
        self._cached_rotation_time = self.rotation_time
        self._cached_grace_hour = self.grace_period
        self._last_query = time.time()
        self.last_rotation = time.time()
        self._next_cleanup_time = self._calculate_next_cleanup()

    def _calculate_next_cleanup(self) -> float:
        now = datetime.now()
        grace_hour = self._cached_grace_hour

        target_time = now.replace(hour=grace_hour, minute=0, second=0, microsecond=0)
        if now.hour >= grace_hour:
            target_time += timedelta(days=1)
        return target_time.timestamp()

    async def get_keys(self) -> Tuple[str, str]:
        now = time.time()

        if now - self._last_query >= self.ttl:
            self._cached_rotation_time = self.rotation_time
            new_grace_hour = self.grace_period
            if new_grace_hour != self._cached_grace_hour:
                self._cached_grace_hour = new_grace_hour
                self._next_cleanup_time = self._calculate_next_cleanup()
            self._last_query = now

        if now - self.last_rotation >= self._cached_rotation_time:
            self.key_session_old = self.key_session_new
            self.key_session_new = generate_secure_key()
            self.last_rotation = now
            logger.info(f"Key cookie rotated at {time.ctime(now)}. Old key cookie will expire at {time.ctime(self._next_cleanup_time)}")

        if self.key_session_old and now >= self._next_cleanup_time:
            logger.info(f"Cleaning old key cookie at scheduled time {time.ctime(now)}")
            self.key_session_old = None

        return self.key_session_new, (self.key_session_old if self.key_session_old else self.key_session_new)

 