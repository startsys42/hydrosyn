from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, RedirectResponse
from itsdangerous import Signer, BadSignature
import uuid
import hashlib
import secrets
import json
from urllib.parse import urlparse
from security.email import send_email
from datetime import datetime, timedelta
from typing import Optional, Dict, Any,Union
from logger import logger
from db.db_middleware import get_session_id_exists_from_db, get_session_from_db,  insert_login_attempts_in_db, get_cookie_expired_time_from_db 
from db.db_auth import delete_session_in_db
from pydantic import BaseModel
from fastapi import HTTPException



class DeviceInfo(BaseModel):
    ram: Optional[Union[int, float]] = None
    cores: Optional[int] = None
    arch: Optional[str] = None
    os: Optional[str] = None
    gpu: Optional[str] = None

class AdvancedSessionMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, key_manager):
        super().__init__(app)
        self.key_manager = key_manager

    async def dispatch(self, request: Request, call_next) -> Response:
        # 1. Obtener claves actuales para verificación
        current_key, old_key = await self.key_manager.get_keys()
        if request.method == "POST":
            form = await request.form()
            lang = form.get("lang")
            theme = form.get("theme")

        # 2. Verificar sesión existente
        session_data_dict = await self._get_valid_session_id(request, current_key, old_key)
        if session_data_dict is None:
            logger.warning("1")
            response_for_cookie = Response()
            await self._create_new_session(request, response_for_cookie, current_key)
            final_response = RedirectResponse(url="/web/auth/login", status_code=303)
            final_response.headers.update(response_for_cookie.headers)
            return final_response
        else:
            session_id = session_data_dict.get("session_id") if session_data_dict else None
            language = session_data_dict.get("language") if session_data_dict else "en"
            theme = session_data_dict.get("theme") if session_data_dict else "light"
            request.state.language = language
            request.state.theme = theme
            request.state.session_id = session_id
            session_data = await get_session_from_db(session_id)
            path = request.url.path
            method = request.method
            client_ip = request.client.host if request.client else "unknown"
            user_agent = request.headers.get("user-agent", "unknown")
            html_source = self._get_html_source(request)
            device_info = DeviceInfo()  # valor por defecto vacío
            origin_path = "unknown"
            if method == "POST":

                try:
                    headers = request.headers
                    device_data = {
                        "ram": headers.get("x-device-ram"),
                        "cores": headers.get("x-device-cpu-cores"),
                        "arch": headers.get("x-device-cpu-arch"),
                        "gpu": headers.get("x-device-gpu"),
                        "os": headers.get("x-device-os"),
                    }

                    clean_data = {k: v for k, v in device_data.items()
                                if v is not None and k in DeviceInfo.__fields__}
                    device_info = DeviceInfo(**clean_data)

                    origin_path = headers.get("x-origin-path", "unknown")

                    logger.info(
                        "Device Info Collected\n"
                        f"IP: {client_ip}\n"
                        f"User-Agent: {user_agent}\n"
                        f"Origin Path: {origin_path}\n"
                        f"Device Data: {device_info.dict(exclude_none=True)}"
                    )
                except Exception as e:
                    logger.warning(
                        "Failed to process device info\n"
                        f"IP: {client_ip}\n"
                        f"User-Agent: {user_agent}\n"
                        f"Error: {str(e)}"
                    )
                    raise HTTPException(status_code=404, detail="Invalid device information")
            if session_data is not None:
                logger.warning("2 ")
                if method == "POST":
                    logger.warning("2.1")
                    if path == "/web/device/device-info":
                        method="GET"
                        path=origin_path
                    current_device_fingerprint = self._get_device_fingerprint(request)
                    if session_data['summary'] != current_device_fingerprint:
                        logger.warning(f"Session detected from a different device for user '{session_data['username']}', possible cookie theft detected.")
                        if session_data['language'] == 'es':
                            message_text = (
                            "Alerta: Posible robo de cookies detectado.\n\n"
                            f"Información del dispositivo: {request.headers.get('User-Agent')}\n"
                            f"Dirección IP: {request.client.host}\n\n"
                            "Si no fuiste tú, por favor asegura tu cuenta inmediatamente."
                            )
                            subject = "Posible robo de cookies detectado"

                        else:  # <- aquí corregí el elif vacío
                            message_text = (
                            "Alert: Possible cookie theft detected.\n\n"
                            f"Device Info: {request.headers.get('User-Agent')}\n"
                            f"IP Address: {request.client.host}\n\n"
                            "If this wasn't you, please secure your account immediately."
                            )
                            subject = "Possible cookie theft detected"

                        await send_email(
                            sender="tu-correo@gmail.com",
                            to=session_data['email'],
                            subject=subject,
                            message_text=message_text
                        )

                        await insert_login_attempts_in_db(
                            session_id=session_id,
                            user_id=session_data['user_id'],
                            ip_address=client_ip,
                            success=False,
                            page=path,
                            http_method=method,
                            user_agent=user_agent,
                            ram_gb=float(device_info.ram) if device_info.ram else None,
                            cpu_cores=int(device_info.cores) if device_info.cores else None,
                            cpu_architecture=device_info.arch,
                            gpu_info=device_info.gpu,
                            device_os=device_info.os,
                            recovery=False,
                        )



                        await delete_session_in_db(session_id)
                        # inserta con user y dats de registro

                        return RedirectResponse(url="/web/auth/login", status_code=303)
                    else:
                        if request.url.path in [ "/web/auth/login","/web/auth/recover-password", "/web/auth/login-two", "/web/auth/recover-password-two","/"]:
                            return RedirectResponse(url="/web/auth/home")
                        else:
                            if origin_path in ["/web/auth/home"]:
                                await insert_login_attempts_in_db(
                                    session_id=session_id,
                                    user_id=session_data['user_id'],
                                    ip_address=client_ip,
                                    success=True,
                                    page=path,
                                    http_method=method,
                                    user_agent=user_agent,
                                    ram_gb=float(device_info.ram) if device_info.ram else None,
                                    cpu_cores=int(device_info.cores) if device_info.cores else None,
                                    cpu_architecture=device_info.arch,
                                    gpu_info=device_info.gpu,
                                    device_os=device_info.os,
                                    recovery=False,
                                )

                            response = await call_next(request)
                            return response

                else:
                    if request.url.path in [ "/web/auth/login","/web/auth/recover-password", "/web/auth/login-two", "/web/auth/recover-password-two","/"]:
                        return RedirectResponse(url="/web/auth/home")
                    else:
                        response = await call_next(request)
                        return response


            else:
                if method == "POST":
                    if path == "/web/device/device-info":
                        method="GET"
                        path=origin_path
                    if request.url.path  in [ "/web/auth/recover-password"]:
                        recovery=True
                    else:
                        recovery=False
                    await insert_login_attempts_in_db(
                        session_id=session_id,
                        ip_address=client_ip,
                        success=False,
                        page=path,
                        http_method=method,
                        user_agent=user_agent,
                        ram_gb=float(device_info.ram) if device_info.ram else None,
                        cpu_cores=int(device_info.cores) if device_info.cores else None,
                        cpu_architecture=device_info.arch,
                        gpu_info=device_info.gpu,
                        device_os=device_info.os,
                        recovery=recovery,
                    )
                    if request.url.path not in [ "/web/auth/login","/web/auth/recover-password", "/web/auth/login-two", "/web/auth/recover-password-two","/","/web/device/device-info",]:
                        return RedirectResponse(url="/web/auth/login")
                    else:
                        response = await call_next(request)
                        return response
                else:
                    if request.url.path not in [ "/web/auth/login","/web/auth/recover-password", "/web/auth/login-two", "/web/auth/recover-password-two","/"]:
                        return RedirectResponse(url="/web/auth/login")
                    else:
                        response = await call_next(request)
                        return response


    


    def _get_html_source(self,request: Request) -> str:
        referer = request.headers.get("referer", "")
        if not referer:
            return "unknown"
    
        try:
   
            parsed = urlparse(referer)
            path = parsed.path
            if path.endswith(".html"):
                return path.split("/")[-1]  # Devuelve "formulario.html"
            return "non_html_page"
        except:
            return "invalid_referer"
            

  
        
 

    async def _create_new_session(self, request: Request, response: Response, current_key: str) -> Response:
        """Crea una nueva sesión después de login exitoso"""
        while True:
            session_id = secrets.token_hex(64)
            exists = await get_session_id_exists_from_db(session_id)
            if not exists:
                break
        
        days = await get_cookie_expired_time_from_db()
        expires_at = datetime.utcnow() + timedelta(days=days)  # 30 días de validez
       
        
        data = {
            "session_id": session_id,
            "language": "en",
            "theme": "light"
        }
        
        # 3. Establecer cookie de sesión
        data_str = json.dumps(data)

# Firmar
        signed_data = Signer(current_key).sign(data_str.encode()).decode()
        response.set_cookie(
            key="session_id",
            value=signed_data,
            httponly=True,
            secure=False,
            path="/",  
            samesite="Lax",
            max_age=days *86400  
        )
        
 
        
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

        device_str = ";".join(f"{k}={v}" for k, v in sorted(device_data.items()) if v)
        return hashlib.sha256(device_str.encode()).hexdigest()

    async def _get_valid_session_id(self, request: Request, current_key: str, old_key: str) -> Optional[Dict[str, Any]]:
        session_cookie = request.cookies.get("session_id")
        logger.debug(f"Cookie recibida: {session_cookie}") 
        if not session_cookie:
            logger.debug("No se encontró cookie de sesión")
            return None

        try:
            signer = Signer(current_key)
            data_str = signer.unsign(session_cookie).decode()
            data = json.loads(data_str)
            logger.debug(f"Sesión válida encontrada: {data}")  # <-- Nuevo log
            return data  # <-- Devuelve todo el diccionario
        except (BadSignature, json.JSONDecodeError) as e:
            logger.warning(f"Error al verificar sesión (clave actual): {str(e)}")
            if old_key:
                try:
                    old_signer = Signer(old_key)
                    data_str = old_signer.unsign(session_cookie).decode()
                    data = json.loads(data_str)
                    logger.debug(f"Sesión válida encontrada con clave antigua: {data}")
                    return data  # <-- Devuelve todo el diccionario
                except (BadSignature, json.JSONDecodeError) as e:
                    logger.warning(f"Error al verificar sesión (clave antigua): {str(e)}")
                    return None
            return None
 
