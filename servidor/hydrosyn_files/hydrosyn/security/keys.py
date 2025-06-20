
import secrets
import time
from typing import Tuple, Callable
from logger import logger  # si querés loguear


import math

def generar_clave_segura(longitud: int = 128) -> str:
    n_bytes = math.ceil(longitud * 3 / 4)  # bytes necesarios para longitud base64
    return secrets.token_urlsafe(n_bytes)[:longitud]  # recortar si se pasa

class GestorClaves:
    def __init__(self, obtener_tiempo_rotacion: Callable[[], int], ttl: int = 600):
        self.obtener_tiempo_rotacion = obtener_tiempo_rotacion
        self.ttl = ttl  # tiempo mínimo entre consultas, en segundos
        self._cache_tiempo_rotacion = self.obtener_tiempo_rotacion()
        self._ultima_consulta = time.time()
        self.ultima_rotacion = time.time()
        self.key_session_new = generar_clave_segura()
        self.key_session_old = self.key_session_new

    def obtener_claves(self) -> Tuple[str, str]:
        ahora = time.time()

        # Si pasaron más de `ttl`, actualiza el valor de la base de datos
        if ahora - self._ultima_consulta >= self.ttl:
            self._cache_tiempo_rotacion = self.obtener_tiempo_rotacion()
            self._ultima_consulta = ahora

        # ¿Es momento de rotar la clave?
        if ahora - self.ultima_rotacion >= self._cache_tiempo_rotacion:
            self.key_session_old = self.key_session_new
            self.key_session_new = generar_clave_segura()
            self.ultima_rotacion = ahora
            logger.info("Rotación de clave de sesión ejecutada")

        return self.key_session_new, self.key_session_old
