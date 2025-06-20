from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from itsdangerous import Signer, BadSignature
from security.keys import GestorClaves
import uuid

class DualSessionMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, gestor_claves: GestorClaves):
        super().__init__(app)
        self.gestor_claves = gestor_claves

    async def dispatch(self, request: Request, call_next):
        key_new, key_old = self.gestor_claves.obtener_claves()

        session_cookie = request.cookies.get("session_id")
        session_data = None

        # ✅ 1. Verificar si la cookie existe y está firmada correctamente
        if session_cookie:
            for key in (key_new, key_old):
                try:
                    signer = Signer(key)
                    session_data = signer.unsign(session_cookie.encode()).decode()
                    # ✅ 2. Guardar el valor de la sesión en el request para usar en endpoints
                    request.state.session_data = session_data
                    break
                except BadSignature:
                    continue

        # ✅ 3. Continuar con la petición
        response = await call_next(request)

        # ✅ 4. Si no había sesión válida, crear una nueva
        if not session_data:
            session_id = str(uuid.uuid4())
            new_value = f"session_id={session_id}"

            signed = Signer(key_new).sign(new_value.encode()).decode()
            response.set_cookie(
                "session_id",
                signed,
                httponly=True,
                secure=True,
                samesite="Lax",  # Puedes usar "Strict" o "None" según necesidad
                max_age=60 * 60 * 24 * 7  # 7 días de validez
            )

        return response
