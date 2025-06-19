from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from itsdangerous import Signer, BadSignature
from .keys import GestorClaves

class DualSessionMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, gestor_claves: GestorClaves):
        super().__init__(app)
        self.gestor_claves = gestor_claves

    async def dispatch(self, request: Request, call_next):
        key_new, key_old = self.gestor_claves.obtener_claves()

        # Aquí podrías hacer validación manual de cookies con itsdangerous.Signer
        # para firmar y verificar tanto con clave nueva como antigua.

        # Este ejemplo simplemente pasa la petición, puedes ampliarlo con lógica real.
        response = await call_next(request)
        return response
