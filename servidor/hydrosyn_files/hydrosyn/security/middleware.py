from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from itsdangerous import Signer, BadSignature
from security.keys import GestorClaves
import uuid
from db.db_config import obtener_tiempo_rotacion_desde_bd
from logger import logger
from db.db_auth import guardar_sesion_en_bd 

class DualSessionMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, key_manager):
        super().__init__(app)
        self.key_manager = key_manager

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
                    request.scope['session'] = {"session_id": session_data}
                    logger.debug(f"Sesión válida detectada: {session_data}")
                    break
                except BadSignature:
                    continue

        # ✅ 3. Continuar con la petición
        if 'session' not in request.scope:
            request.scope['session'] = {}
        response = await call_next(request)

        # ✅ 4. Si no había sesión válida, crear una nueva
        if not session_data:
            session_id = str(uuid.uuid4())
            signed = Signer(key_new).sign(session_id.encode()).decode()
            max_age = obtener_tiempo_rotacion_desde_bd()

            response.set_cookie(
                "session_id",
                signed,
                httponly=True,
                secure=True,
                samesite="Lax",
                max_age=max_age
            )

            logger.info(f"Sesión nueva creada: {session_id}")

            # 🔽 Aquí guardamos en la base de datos
            user_id = getattr(request.state, "user_id", None)  # puedes configurar esto antes si quieres
            user_agent = request.headers.get("user-agent", "")[:512]
            ip = request.client.host

            if user_id:
                guardar_sesion_en_bd(user_id, session_id, key_new, user_agent, ip, max_age)

        return response
