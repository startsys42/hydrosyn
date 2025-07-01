from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, RedirectResponse
from itsdangerous import Signer, BadSignature
import uuid
from datetime import datetime, timedelta
from typing import Optional, Dict, Any

class AdvancedSessionMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, key_manager, db_handler):
        super().__init__(app)
        self.key_manager = key_manager
        self.db_handler = db_handler

    async def dispatch(self, request: Request, call_next) -> Response:
        # 1. Obtener claves actuales para verificación
        current_key, old_key = self.key_manager.get_keys()
        
        # 2. Verificar sesión existente
        session_id = await self._get_valid_session_id(request, current_key, old_key)
        user_id = None
        is_logged_in = False
        
        # 3. Validar sesión en BD si existe
        if session_id:
            session_data = self.db_handler.get_session(session_id)
            if session_data:
                if session_data['expires_at'] > datetime.utcnow():
                    user_id = session_data['user_id']
                    is_logged_in = bool(user_id)
                    
                    # Terminar otras sesiones si es nuevo login
                    if hasattr(request.state, 'is_new_login') and request.state.is_new_login:
                        self.db_handler.terminate_other_sessions(user_id, session_id)
        
        # 4. Manejar preferencias de usuario/guest
        await self._handle_user_preferences(request, user_id, is_logged_in)
        
        # 5. Procesar la petición principal
        response = await call_next(request)
        
        # 6. Crear nueva sesión si es necesario (post-login)
        if hasattr(request.state, 'should_create_session') and request.state.should_create_session:
            response = await self._create_new_session(request, response, current_key)
        
        return response

    async def _get_valid_session_id(self, request: Request, current_key: str, old_key: str) -> Optional[str]:
        """Extrae y valida el session_id de las cookies"""
        if cookie := request.cookies.get("session_id"):
            for key in [current_key, old_key]:
                try:
                    return Signer(key).unsign(cookie.encode()).decode()
                except BadSignature:
                    continue
        return None

    async def _handle_user_preferences(self, request: Request, user_id: Optional[str], is_logged_in: bool):
        """Gestiona tema/idioma para usuarios logueados y guests"""
        # Preferencias base
        prefs = {
            'theme': 'light',
            'language': 'es'
        }
        
        # 1. Obtener preferencias actuales (de cookies o BD)
        if is_logged_in:
            # Usuario logueado: preferencias de BD
            db_prefs = self.db_handler.get_user_preferences(user_id)
            prefs.update(db_prefs)
        else:
            # Usuario guest: preferencias de cookies
            prefs['theme'] = request.cookies.get('guest_theme', prefs['theme'])
            prefs['language'] = request.cookies.get('guest_language', prefs['language'])
        
        # 2. Aplicar cambios si vienen en la request
        if 'theme' in request.query_params:
            prefs['theme'] = request.query_params['theme']
        if 'language' in request.query_params:
            prefs['language'] = request.query_params['language']
        
        # 3. Guardar estado en el request
        request.state.prefs = prefs
        request.state.is_logged_in = is_logged_in
        request.state.user_id = user_id

    async def _create_new_session(self, request: Request, response: Response, current_key: str) -> Response:
        """Crea una nueva sesión después de login exitoso"""
        session_id = str(uuid.uuid4())
        expires_at = datetime.utcnow() + timedelta(days=30)  # 30 días de validez
        
        # 1. Guardar sesión en BD
        self.db_handler.create_session(
            user_id=request.state.user_id,
            session_id=session_id,
            expires_at=expires_at,
            user_agent=request.headers.get("user-agent", "")[:512],
            ip=request.client.host
        )
        
        # 2. Actualizar preferencias en BD si cambiaron
        if hasattr(request.state, 'updated_prefs'):
            self.db_handler.update_user_preferences(
                request.state.user_id,
                request.state.updated_prefs
            )
        
        # 3. Establecer cookie de sesión
        signed_session = Signer(current_key).sign(session_id.encode()).decode()
        response.set_cookie(
            key="session_id",
            value=signed_session,
            httponly=True,
            secure=True,
            samesite="Lax",
            max_age=30*24*60*60  # 30 días en segundos
        )
        
        # 4. Limpiar cookies de guest si existían
        response.delete_cookie("guest_theme")
        response.delete_cookie("guest_language")
        
        return response
