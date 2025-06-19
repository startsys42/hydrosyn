
import secrets
import time
from typing import Tuple, Callable

import math

def generar_clave_segura(longitud: int = 128) -> str:
    n_bytes = math.ceil(longitud * 3 / 4)  # bytes necesarios para longitud base64
    return secrets.token_urlsafe(n_bytes)[:longitud]  # recortar si se pasa

class GestorClaves:
    def __init__(self, obtener_tiempo_rotacion: Callable[[], int]):
        self.obtener_tiempo_rotacion = obtener_tiempo_rotacion
        self.ultima_rotacion = time.time()
        self.key_session_new = generar_clave_segura()
        self.key_session_old = self.key_session_new

    def obtener_claves(self) -> Tuple[str, str]:
        ahora = time.time()
        tiempo_rotacion_actual = self.obtener_tiempo_rotacion()
        if ahora - self.ultima_rotacion >= tiempo_rotacion_actual:
            self.key_session_old = self.key_session_new
            self.key_session_new = generar_clave_segura()
            self.ultima_rotacion = ahora
        return self.key_session_new, self.key_session_old
