from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, RedirectResponse
from itsdangerous import Signer, BadSignature
import uuid
from datetime import datetime, timedelta
from typing import Optional, Dict, Any

# poenr httponly
class AdvancedSessionMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, key_manager):
        super().__init__(app)
        self.key_manager = key_manager


    async def dispatch(self, request: Request, call_next) -> Response:
        # 1. Obtener claves actuales para verificación
        current_key, old_key = self.key_manager.get_keys()
        
        # 2. Verificar sesión existente
        session_id = await self._get_valid_session_id(request, current_key, old_key)
        user_id = None
        is_logged_in = False
        
        # 3. Validar sesión en BD si existe
        if session_id:
            session_data = get_session_from_db(session_id)
    
            if session_data:
        # Verificar si la sesión es de ESTE dispositivo
                current_device = self._get_device_fingerprint(request)
        
               if session_data['summary'] != current_device_fingerprint:  # ⬅️ Comparación clave
               logger.warning(
    f"Session detected from a different device for user '{session_data['username']}'."
)
                 self._send_security_alert(
        user_id=session_data['user_id'],
        device=request.headers.get("User-Agent"),
        ip=request.client.host
    )
    
    self.db_handler.delete_session(session_id)
    return RedirectResponse(url="/login?error=dispositivo_no_coincide", status_code=303)
                session_id = None
            else:
                # 2. Si todo coincide, usuario está autenticado
                user_id = session_data['user_id']
                is_logged_in = True
                request.state.user_id = user_id
        
 

        ##BLOQUEAR ACCESOS
        
        # 5. Procesar la petición principal
        response = await call_next(request)
        
        # 6. Crear nueva sesión si es necesario (post-login)
        # modificar valores  base ded atos sie s necesario
        if hasattr(request.state, 'should_create_session') and request.state.should_create_session:
            response = await self._create_new_session(request, response, current_key)
        
        return response


 

    async def _create_new_session(self, request: Request, response: Response, current_key: str) -> Response:
        """Crea una nueva sesión después de login exitoso"""
        session_id = secrets.token_hex(64)
        days = get_cookie_expired_time_from_db()
        expires_at = datetime.utcnow() + timedelta(days=days)  # 30 días de validez
        
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
            max_age=days *86400  
        )
        
        # 4. Limpiar cookies de guest si existían
        response.delete_cookie("guest_theme")
        response.delete_cookie("guest_language")
        
        return response
def _get_device_fingerprint(self, request: Request) -> str:
        """Genera un ID único por dispositivo usando información de hardware del cliente"""
        device_data = {
           # "ip": request.client.host,
            "user_agent": request.headers.get("user-agent", ""),
            "ram": request.headers.get("x-device-ram"),
            "cpu_cores": request.headers.get("x-device-cpu-cores"),
            "cpu_arch": request.headers.get("x-device-cpu-arch"),
            "gpu": request.headers.get("x-device-gpu"),
            "os": request.headers.get("x-device-os"),
        }
        
        device_str = ";".join(
        f"{k}={v}" 
        for k, v in sorted(device_data.items()) 
        if v  # Filtramos valores vacíos
    )
    
    return hashlib.sha256(device_str.encode()).hexdigest()
async def _get_valid_session_id(self, request: Request, current_key: str, old_key: str) -> Optional[str]:
    session_cookie = request.cookies.get("session_id")
    if not session_cookie:
        return None  # No existe la cookie
    
    try:
        # Intentar con la clave actual
        signer = Signer(current_key)
        return signer.unsign(session_cookie).decode()
    except BadSignature:
        if old_key:
            # Intentar con la clave antigua (rotación)
            old_signer = Signer(old_key)
            try:
                return old_signer.unsign(session_cookie).decode()
            except BadSignature:
                return None  # Cookie inválida
        return None
