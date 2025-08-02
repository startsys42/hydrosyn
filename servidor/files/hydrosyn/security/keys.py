
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
    def __init__(self):
        self.current_key = generate_secure_key()
        self.next_rotation = self._calculate_next_rotation()
        
    def _calculate_next_rotation(self) -> float:
        """Calcula el próximo tiempo de rotación en 30 días exactos desde ahora"""
        return (datetime.now() + timedelta(days=30)).timestamp()
    
    def get_current_key(self) -> str:
        """Devuelve la clave actual y rota si es necesario"""
        if time.time() >= self.next_rotation:
            self.current_key = generate_secure_key()
            self.next_rotation = self._calculate_next_rotation()
            print(f"Rotación de clave realizada el {datetime.now().isoformat()}")
        return self.current_key
    async def get_keys(self) -> Tuple[str, str]:
        """Devuelve (current_key, current_key) para compatibilidad con middleware"""
        key = self.get_current_key()
        return key, key