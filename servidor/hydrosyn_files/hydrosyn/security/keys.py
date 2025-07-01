
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
        self._last_query = time.time()
        self.last_rotation = time.time()
        self.key_session_new = generate_secure_key()
        self.key_session_old = self.key_session_new

    def get_keys(self) -> Tuple[str, str]:
        now = time.time()

        # If more than `ttl` seconds passed, update value from the database
        if now - self._last_query >= self.ttl:
            self._cached_rotation_time = self.get_rotation_time()
            self._last_query = now

        # Is it time to rotate the key?
        if now - self.last_rotation >= self._cached_rotation_time:
            self.key_session_old = self.key_session_new
            self.key_session_new = generate_secure_key()
            self.last_rotation = now
            logger.info("Session key rotation executed")

        return self.key_session_new, self.key_session_old

class JWTKeyManager:
    def __init__(self, get_rotation_time: Callable[[], int], ttl: int = 600):
        self.get_rotation_time = get_rotation_time
        self.ttl = ttl
        self._cached_rotation_time = self.get_rotation_time()
        self._last_query = time.time()
        self.last_rotation = time.time()
        self.key_session_new = generate_secure_key()
        self.key_session_old = self.key_session_new

    def get_keys(self) -> Tuple[str, str]:
        now = time.time()

        if now - self._last_query >= self.ttl:
            self._cached_rotation_time = self.get_rotation_time()
            self._last_query = now

        if now - self.last_rotation >= self._cached_rotation_time:
            self.key_session_old = self.key_session_new
            self.key_session_new = generate_secure_key()
            self.last_rotation = now
            logger.info("JWT key rotation executed")

        return self.key_session_new, self.key_session_old
