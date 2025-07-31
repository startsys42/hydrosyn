from email.mime import message
from urllib import request
from security.same_device import sameDevice
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, JSONResponse
from itsdangerous import Signer, BadSignature
import uuid
import hashlib
import secrets
import json

from datetime import datetime, timezone
from typing import Optional, Dict, Any,Union
from logger import logger
from security.csrf import generate_csrf_token
from db.db_middleware import get_session_id_exists_from_db, get_session_from_db,  insert_login_attempts_in_db, get_cookie_expired_time_from_db 
from db.db_users import delete_session_in_db
from pydantic import BaseModel
from fastapi import HTTPException
from services.notifications import create_user_notification

#bloquear por rutas publcias si no hays esion id
#crear notificaion robo cookie admin y usuario, controlar lo del apsswords, lo del name, 



class AdvancedSessionMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, key_manager):
        super().__init__(app)
        self.key_manager = key_manager

    async def dispatch(self, request: Request, call_next) -> Response:
        # 1. Obtener claves actuales para verificación
        current_key, old_key = await self.key_manager.get_keys()
        
        logger.info("entro al middleware")
        # 2. Verificar sesión existente
        session_data_dict = await self._get_valid_session_id(request, current_key, old_key)
        if session_data_dict is None:
            
            request.state.json_data = await request.json() if request.method == "POST" else {}

        # 🔁 Reinyectar el body para que el endpoint lo pueda volver a leer
            async def receive():
                return {"type": "http.request", "body": body_bytes}

            request._receive = receive
            token = await generate_csrf_token()

            response= JSONResponse(
               status_code=200,
               content={
                   "ok": True,
                   "status": 200,
                   "loggedIn": False,
                    "csrf": token,
                    "language": "en",
                    "theme": "light",
                    "permission": False
                }
            )
            await self._create_new_session(request, response, current_key, request.state.json_data)
            #response = await call_next(request)
            
          
            #falta un insert login attempts
            return response
        else:
            session_id = session_data_dict.get("session_id") if session_data_dict else None
            language = session_data_dict.get("language") if session_data_dict else "en"
            theme = session_data_dict.get("theme") if session_data_dict else "light"
            request.state.language = language
            request.state.theme = theme
            request.state.session_id = session_id
            session_data = await get_session_from_db(session_id)
            if session_data and session_data['is_active'] == False:
                logger.warning(f"Session {session_data['username']} is inactive, redirecting to login")
                await delete_session_in_db(session_id)
                return JSONResponse(
                    status_code=401,  # Bad Request
                    content={
                        "ok": False,
                        "status": 401,  # Opcional: para que React sepa a dónde redirigir
                        "message": "Session expired or invalid, please login again",
                    }
                )
            elif session_data is not  None:
                request.state.user_id = session_data['user_id']
                request.state.username = session_data['username']
                request.state.email = session_data['email']
                request.state.summary = session_data['summary']
                
                request.state.change_pass = True if session_data.get('change_pass') is not None else False
                request.state.change_name = True if session_data.get('change_name') is not None else False
                body_bytes = await request.body()
    
    # 2. Crear una función de receive para reenviar el body intacto
                async def receive():
                    return {"type": "http.request", "body": body_bytes}

                # 3. Reasignar el método _receive para preservar los datos
                request._receive = receive
                try:
                    body_dict = json.loads(body_bytes.decode())
                except json.JSONDecodeError:
                    body_dict = {}
                logger.info(f"body_dict: {body_dict}")
                if sameDevice(body_dict,request.state.summary, request.state.user_id, request.state.username, request.client.host, request.state.language, request.state.email):
                    await delete_session_in_db(session_id)
                    #REGISTRO LOGGIN ATTEMP
                    return JSONResponse(
                        status_code=403,
                        content={
                            "ok": False,
                            "status": 403,
                        
                        }
                    )

    
                response = await call_next(request)
                # los registro login
                if request.path == "/api/change-lang-theme":
                    await self.update_cookie_lang_theme(
                        request=request,
                        response=response,
                        current_key=current_key,
                        old_key=old_key,
                        new_lang=request.state.language,
                        new_theme=request.state.theme
                    )
                return response
            else:
                request.state.json_data = await request.json() if request.method == "POST" else {}
                x_forwarded_for = request.headers.get("x-forwarded-for")
                if x_forwarded_for:
                    # Puede contener varias IPs separadas por coma, la primera es la real
                    ip = x_forwarded_for.split(",")[0].strip()
                else:
                    # Fallback a la IP del cliente que conectó directamente (NGINX)
                    ip = request.client.host
                request.state.ip=ip
                if request.url.path not in ["/api/change-language-theme", "/api/check-access", "/api/recover-password","/api/login"]:
                    await insert_login_attempts_in_db(
                        session_id,
                        None,
                        ip,
                        False,
                        request.state.json_data.get("origin"),
                        request.method,
                        datetime.now(),
                        request.state.json_data.get("userAgent"),
                        request.state.json_data.get("deviceMemory"),
                        request.state.json_data.get("cpuCores"),
                        request.state.json_data.get("gpuInfo"),
                        request.state.json_data.get("os"),
                        
                    )
                    return JSONResponse(
                        status_code=401,
                        content={
                            "ok": False,
                            "status": 401,
                            "message": "Session expired or invalid, please login again",

                        }
                    )

                        
                        

                    # Si es una ruta pública, no se requiere sesión
                request.state.date = datetime.now()
                response = await call_next(request)
                success = False
                user_id = None
                path=request.state.json_data.get("os"),
                if hasattr(request.state, 'user_id'):
                    user_id = request.state.user_id
                if hasattr(request.state, 'success'):
                    success = request.state.success
               
                if request.url.path == "/api/change-lang-theme":
                    await self.update_cookie_lang_theme(
                        request=request,
                        response=response,
                        current_key=current_key,
                        old_key=old_key,
                        new_lang=request.state.language,
                        new_theme=request.state.theme
                    )
                    path = request.url.path

                await insert_login_attempts_in_db(
                        session_id,
                        user_id,
                        ip,
                        success,
                        request.state.json_data.get("origin"),
                        request.method,
                        request.state.time,
                        request.state.json_data.get("userAgent"),
                        request.state.json_data.get("deviceMemory"),
                        request.state.json_data.get("cpuCores"),
                        request.state.json_data.get("gpuInfo"),
                        path,
                        
                        
                    )
                
                return response
                # regsitro y check y cambair idioma tema
            #insertar en login
            
           

    async def _create_new_session(self, request: Request, response: Response, current_key: str, json_data: dict):
        """Crea una nueva sesión después de login exitoso"""
        while True:
            session_id = secrets.token_hex(64)
            exists = await get_session_id_exists_from_db(session_id)
            if not exists:
                break
        
        
       
        
        data = {
            "session_id": session_id,
            "language": "en",
            "theme": "light"
        }
        x_forwarded_for = request.headers.get("x-forwarded-for")
        if x_forwarded_for:
            # Puede contener varias IPs separadas por coma, la primera es la real
            ip = x_forwarded_for.split(",")[0].strip()
        else:
            # Fallback a la IP del cliente que conectó directamente (NGINX)
            ip = request.client.host
        logger.info(f"IP del cliente: {ip}, json_data: {json_data}")

       
        await insert_login_attempts_in_db(
            session_id,
            None,
            ip,
            False,
            json_data.get("origin"),              
            request.method,
            datetime.now(),
            json_data.get("userAgent"),
            json_data.get("deviceMemory"),
            json_data.get("cpuCores"),
#         
            json_data.get("gpuInfo"),
            json_data.get("os"),
          
            
            
        )

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
            max_age=30 *86400  
        )
        
 
        
    

 

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
        self,
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
       

        response.set_cookie(
            key="hydrosyn_session_id",
            value=new_signed,
            httponly=True,
            secure=False,
            path="/",
            samesite="Lax",
            max_age=30 * 86400
        )