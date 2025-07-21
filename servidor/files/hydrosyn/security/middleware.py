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
from db.db_users import delete_session_in_db
from pydantic import BaseModel
from fastapi import HTTPException

#crear notificaion robo cookie admin y usuario, controlar lo del apsswords, lo del name, 

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
      

        # 2. Verificar sesión existente
        session_data_dict = await self._get_valid_session_id(request, current_key, old_key)
        if session_data_dict is None:
            logger.warning("1")
            response_for_cookie = Response()
            await self._create_new_session(request, response_for_cookie, current_key)
            final_response = RedirectResponse(url="/web/login", status_code=303)
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
            if session_data and session_data['is_active'] == False:
                logger.warning(f"Session {session_id} is inactive, redirecting to login")
                await delete_session_in_db(session_id)
                return RedirectResponse(url="/web/login", status_code=303)
            
            path = request.url.path
            logger.info(f"path:  {path}")
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
                    if path == "/web/device-info":
                        method="GET"
                        path=origin_path
                    current_device_fingerprint = self._get_device_fingerprint(request)
                    if session_data['summary'] != current_device_fingerprint:
                        logger.warning(f"Session detected from a different device for user '{session_data['username']}', possible cookie theft detected.")
                        create_user_notification(
                            notification_id=2,  # ID de la notificación de robo de cookies
                            user_id=session_data['user_id'],
                            username=session_data['username'],
                            ip=client_ip,
                            lang=session_data['language'],
                            email=session_data['email'],
                            date=datetime.now(),   
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

                        return RedirectResponse(url="/web/login", status_code=303)
                    else:
                        if request.url.path in [ "/web/login","/web/recover-password", "/web/login-two", "/web/recover-password-two","/"]:
                            return RedirectResponse(url="/web/home")
                        else:
                            if origin_path in ["/web/home"]:
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
                            if request.url.path == "/web/change-lang-theme":
                                await update_cookie_lang_theme(
                                    request=request,
                                    response=response,
                                    current_key=current_key,
                                    old_key=old_key,
                                    new_lang=request.state.language,
                                    new_theme=request.state.theme
                                )
                            return response

                else:
                    if request.url.path in [ "/web/login","/web/recover-password", "/web/login-two", "/web/recover-password-two","/"]:
                        return RedirectResponse(url="/web/home")
                    else:
                        response = await call_next(request)
                        return response


            else:
                if method == "POST":
                    if path == "/web/device-info":
                        method="GET"
                        path=origin_path
                    if request.url.path  in [ "/web/recover-password", "/web/recover-password-two"]:
                        recovery=True
                    else:
                        recovery=False
                    
                    if request.url.path not in [ "/web/login","/web/recover-password", "/web/login-two", "/web/recover-password-two","/","/web/device-info","/web/change-lang-theme"]:
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
                        return RedirectResponse(url="/web/login")
                    else:
                        response = await call_next(request)
                        succes=False
                        if request.url.path == "/web/change-lang-theme":
                            

        # Ejemplo: forzar que siempre se actualice a idioma inglés y tema claro
                            await update_cookie_lang_theme(
                                request=request,
                                response=response,
                                current_key=current_key,
                                old_key=old_key,
                                new_lang=request.state.language,
                                new_theme=request.state.theme
                            )
                            #el di el time
                        if hasattr(request.state, 'success'):
                            if request.state.success:
                                success=True
                        if hasattr(request.state, 'user_id'):
                            user_id = request.state.user_id if hasattr(request.state, 'user_id') else None
                        if hasattr(request.state, 'date'):
                            date = request.state.date if hasattr(request.state, 'date') else None
                        await insert_login_attempts_in_db(
                        session_id=session_id,
                        user_id=user_id,
                        ip_address=client_ip,
                        success=success,
                        page=path,
                        http_method=method,
                        attempt_time=date,
                        user_agent=user_agent,
                        ram_gb=float(device_info.ram) if device_info.ram else None,
                        cpu_cores=int(device_info.cores) if device_info.cores else None,
                        cpu_architecture=device_info.arch,
                        gpu_info=device_info.gpu,
                        device_os=device_info.os,
                        recovery=recovery,
                    )
                        return response
                else:
                    if request.url.path not in [ "/web/login","/web/recover-password", "/web/login-two", "/web/recover-password-two","/"]:
                        return RedirectResponse(url="/web/login")
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
            key="hydrosyn_session_id",
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
        session_cookie = request.cookies.get("hydrosyn_session_id")
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
 
async def update_cookie_lang_theme(
    request: Request,
    response: Response,
    current_key: str,
    old_key: str | None = None,
    new_lang: str = "en",
    new_theme: str = "light"
) -> None:
    

    session_cookie = request.cookies.get("hydrosyn_session_id")
    if not session_cookie:
        logger.warning("No session cookie found")
        raise HTTPException(
            status_code=401,  # or 400 if you prefer
            detail="Session cookie not found"
        )

    try:
        signer = Signer(current_key)
        data_str = signer.unsign(session_cookie).decode()
    except BadSignature:
        if old_key:
            try:
                signer = Signer(old_key)
                data_str = signer.unsign(session_cookie).decode()
            except BadSignature:
                return
        else:
            return

    try:
        data = json.loads(data_str)
    except json.JSONDecodeError:
        return

    # Actualiza idioma y tema
    data["language"] = new_lang
    data["theme"] = new_theme

    # Vuelve a firmar y guardar en cookie
    new_signed = Signer(current_key).sign(json.dumps(data).encode()).decode()
    days = await get_cookie_expired_time_from_db()

    response.set_cookie(
        key="hydrosyn_session_id",
        value=new_signed,
        httponly=True,
        secure=False,
        path="/",
        samesite="Lax",
        max_age=days * 86400
    )