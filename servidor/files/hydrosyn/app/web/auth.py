from fastapi import APIRouter, Request
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from app.web.utils import get_user_preferences, ERROR_MESSAGES
from fastapi.responses import PlainTextResponse
from fastapi import Form, status
from fastapi.responses import RedirectResponse
from common.templates import templates
from logger import logger
from security.csrf import generate_csrf_token, validate_and_remove_csrf_token
import os
from fastapi import Query

from security.email import send_email
from db.db_users import delete_session_in_db, is_in_blacklist_from_db, generate_unique_token_and_store_in_db
from pydantic import BaseModel, EmailStr
from security.two_steps import generate_two_step_token, validate_two_step_token , remove_two_step_token
from db.db_auth import get_user_login_from_db

class UserInput(BaseModel):
    email: EmailStr

router = APIRouter(tags=["Web Auth"])
# poenr los formualrios con campos dinamicos, si em logueo bien borrar sesiona nterior o registar el rpimer iniciod e sesion y tareas para el rpiemr usuaro iniciod e sesion notificacion




@router.get("/login", response_class=HTMLResponse)
async def login_get(request: Request):
    try:
        prefs = get_user_preferences(request)
        csrf_token = generate_csrf_token()
    except ValueError as e:
        return PlainTextResponse(str(e), status_code=400)

    return templates.TemplateResponse("login.html", {
        "request": request,
        "texts": prefs["texts"],
        "lang": prefs["lang"],
        "theme": prefs["theme"],
        "csrf_token": csrf_token
    })
    
@router.post("/login", response_class=HTMLResponse)
async def login_post(
    request: Request,
    username: str = Form(...),
    password: str = Form(...),
    csrf_token: str = Form(...)
):
    try:
        prefs = get_user_preferences(request)
    except ValueError as e:
        return PlainTextResponse(str(e), status_code=400)
    

   # aquid ebo guardar notificacion
    if await is_in_blacklist_from_db(username):
        request.state.blacklist = True
        error_key = "account_not_exists"  # o "invalid_csrf"
        error_message = ERROR_MESSAGES[error_key][prefs["lang"]]
        return templates.TemplateResponse("login", {
            "request": request,
            "texts": prefs["texts"],
            "lang": prefs["lang"],
            "theme": prefs["theme"],
            "error": error_message
        }, status_code=403)
    else:
        request.state.blacklist = False
       
    user_data = await get_user_login_from_db(username, password=password)
    
    if not user_data:
        request.state.user_exist = False
        error_key = "credentials"
        error_message = ERROR_MESSAGES[error_key][prefs["lang"]]
        return templates.TemplateResponse("login", {
            "request": request,
            "texts": prefs["texts"],
            "lang": prefs["lang"],
            "theme": prefs["theme"],
            "error": error_message
        }, status_code=403)
    else:

        request.state.user_exist = True
        if user_data["is_active"]==True:
            request.state.is_active = True
        # si usuario cincide epro contraseña noe nvair emnsaje notifiacion
            if user_data["hash"]=="same":
                request.state.hash = True
                if not validate_csrf_token(csrf_token):
                    request.state.csrf = False
                    error_key = "invalid_csrf"  # o "invalid_csrf"
                    error_message = ERROR_MESSAGES[error_key][prefs["lang"]]
                    return templates.TemplateResponse("login", {
                        "request": request,
                        "texts": prefs["texts"],
                        "lang": prefs["lang"],
                        "theme": prefs["theme"],
                        "error": error_message
                    }, status_code=403)
                else:
                    request.state.csrf = True
                    if user_data["two_fa"] is False:
                        device_info = {
                            "ram": request.headers.get("x-device-ram"),
                            "cpu_cores": request.headers.get("x-device-cpu-cores"),
                            "cpu_arch": request.headers.get("x-device-cpu-arch"),
                            "gpu": request.headers.get("x-device-gpu"),
                            "os": request.headers.get("x-device-os"),
                            "origin_path": request.headers.get("x-origin-path")
                        }
                        code=generate_unique_token_and_store_in_db(
                            user_data["id"],
                            user_data["email"],
                            request.client.host,
                            request.headers.get("user-agent"),
                            ram_gb=device_info.get("ram"),
                            cpu_cores=device_info.get("cpu_cores"),
                            cpu_architecture=device_info.get("cpu_arch"),
                            gpu_info=device_info.get("gpu"),
                            device_os=device_info.get("os")
                        )
                        sender_email = os.getenv("EMAIL_SENDER")
                        if user_data["language"] == "es":
                            email_subject = "Hydrosyn: tu código de verificación"
                            email_body = f"""
                            Hola,

                            Tu código de verificación es: {code}

                            Este código expirará en 5 minutos.

                            IP de la solicitud: {request.client.host}
                            Dispositivo: {device_info.get("os") or 'Desconocido'}
                            """
                        else:
                                email_subject = "Hydrosyn: your verification code"
                                email_body = f"""
                                Hello,

                                Your verification code is: {code}

                                This code will expire in 5 minutes.

                                Request IP: {request.client.host}
                                Device: {device_info.get("os") or 'Unknown'}
                                """

                        send_success = send_email(
                            sender=sender_email,
                            to=user_data["email"],
                            subject=email_subject,
                            message_text=email_body
                        )

                    #enviar correo
                    two_token=generate_two_step_token(user_data["id"], request.state.session_id, twofa=user_data["use_2fa"])
                    request.state.two_fa = True
                    return templates.TemplateResponse("login-two", {
                        "request": request,
                        "texts": prefs["texts"],
                        "lang": prefs["lang"],
                        "theme": prefs["theme"],
                        "two_token": two_token
                    })

                  
                    
            else:
                request.state.hash = False
                error_key = "credentials"
                error_message = ERROR_MESSAGES[error_key][prefs["lang"]]
                return templates.TemplateResponse("login", {
                    "request": request,
                    "texts": prefs["texts"],
                    "lang": prefs["lang"],
                    "theme": prefs["theme"],
                    "error": error_message
                }, status_code=403)
        else:
            request.state.is_active = False
            error_key = "credentials"
            error_message = ERROR_MESSAGES[error_key][prefs["lang"]]
            return templates.TemplateResponse("login", {
                "request": request,
                "texts": prefs["texts"],
                "lang": prefs["lang"],
                "theme": prefs["theme"],
                "error": error_message
            }, status_code=403)
                
        
  
    

## evrificar si esta activo si tiene two fa  y envairb codigo ye so , cmabiar nombre cambair apssword, ...




@router.get("/login-two", response_class=HTMLResponse)
async def login_two_get(request: Request, two_token: str = Query(...)):
    try:
        prefs = get_user_preferences(request)
    except ValueError as e:
        return PlainTextResponse(str(e), status_code=400)

    return templates.TemplateResponse("login_two.html", {
        "request": request,
        "texts": prefs["texts"],
        "lang": prefs["lang"],
        "theme": prefs["theme"],
        "two_token": two_token
      
    })

## debe comprobar nombre cookie tema e idioam contraseñas,... inactivo, mdoificar cookie , priemr inicio  nombre reglas y contarseña, guardar sesion
@router.post("/login-two", response_class=HTMLResponse)
async def login_two_post(request: Request, username: str = Form(...), password: str = Form(...)):
    try:
        prefs = get_user_preferences(request)
    except ValueError as e:
        return PlainTextResponse(str(e), status_code=400)


    if authenticate_user(username, password):
        # Autenticación OK, redirigir a dashboard o página segura
        response = RedirectResponse(url="/dashboard", status_code=status.HTTP_303_SEE_OTHER)
        # Aquí deberías crear sesión o cookie segura
        response.set_cookie(key="session", value="token_o_id_seguro", httponly=True)
        return response
    else:
        # Falló autenticación, volver a mostrar login con mensaje error
        return templates.TemplateResponse("login.html", {
            "request": request,
            "texts": prefs["texts"],
            "lang": prefs["lang"],
            "theme": prefs["theme"],
            "next_lang": prefs["next_lang"],
            "next_theme": prefs["next_theme"],
            "error": "Usuario o contraseña incorrectos"
        }, status_code=400)


@router.get("/recover-password", response_class=HTMLResponse)
async def recover_password_get(request: Request):
    try:
        prefs = get_user_preferences(request)
        csrf_token = generate_csrf_token()
    except ValueError as e:
        return PlainTextResponse(str(e), status_code=400)
    # Aquí puedes añadir lógica para verificar si el usuario ya existe o no

    return templates.TemplateResponse("recover_password.html", {
        "request": request,
        "texts": prefs["texts"],
        "lang": prefs["lang"],
        "theme": prefs["theme"],
        "csrf_token": csrf_token
    })



@router.post("/recover-password", response_class=HTMLResponse)
async def recover_password_post(request: Request,username: str = Form(...), email: EmailStr = Form(...), csrf_token: str = Form(...)):
    try:
        prefs = get_user_preferences(request)
    except ValueError as e:
        return PlainTextResponse(str(e), status_code=400)
    
    if await is_in_blacklist_from_db(username):
        request.state.blacklist = True
        error_key = "account_not_exists"  # o "invalid_csrf"
        error_message = ERROR_MESSAGES[error_key][prefs["lang"]]
        return templates.TemplateResponse("recover-password", {
            "request": request,
            "texts": prefs["texts"],
            "lang": prefs["lang"],
            "theme": prefs["theme"],
            "error": error_message
        }, status_code=403)
    else:
        request.state.blacklist = False
    
    user_data = await get_user_login_from_db(username, email=email)
    if not user_data:
        request.state.user_exist = False
        error_key = "credentials"
        error_message = ERROR_MESSAGES[error_key][prefs["lang"]]
        return templates.TemplateResponse("recover-password", {
            "request": request,
            "texts": prefs["texts"],
            "lang": prefs["lang"],
            "theme": prefs["theme"],
            "error": error_message
        }, status_code=403)
    else:
        if user_data["username"]=="exist_username":
            request.state.user_exist = True
        else:
            request.state.user_exist = False
        if user_data["dict_email"]=="exist_email":
            request.state.email_exist = True
        else:
            request.state.email_exist = False
        if user_data["is_active"]==True:
            request.state.is_active = True
        else:
            request.state.is_active = False
        if request.state.user_exist==False or request.state.email_exist==False or request.state.is_active==False:
            error_key = "credentials"
            error_message = ERROR_MESSAGES[error_key][prefs["lang"]]
            return templates.TemplateResponse("recover-password", {
                "request": request,
                "texts": prefs["texts"],
                "lang": prefs["lang"],
                "theme": prefs["theme"],
                "error": error_message
            }, status_code=403)
            
        else:
            if not validate_csrf_token(csrf_token):
                    request.state.csrf = False
                    error_key = "invalid_csrf"  # o "invalid_csrf"
                    error_message = ERROR_MESSAGES[error_key][prefs["lang"]]
                    return templates.TemplateResponse("recover-password", {
                        "request": request,
                        "texts": prefs["texts"],
                        "lang": prefs["lang"],
                        "theme": prefs["theme"],
                        "error": error_message
                    }, status_code=403)
            else:
                request.state.csrf = True
                if user_data["two_fa"] is False:
                    device_info = {
                            "ram": request.headers.get("x-device-ram"),
                            "cpu_cores": request.headers.get("x-device-cpu-cores"),
                            "cpu_arch": request.headers.get("x-device-cpu-arch"),
                            "gpu": request.headers.get("x-device-gpu"),
                            "os": request.headers.get("x-device-os"),
                            "origin_path": request.headers.get("x-origin-path")
                        }
                    code=generate_unique_token_and_store_in_db(
                        user_data["id"],
                        user_data["email"],
                        request.client.host,
                        request.headers.get("user-agent"),
                        ram_gb=device_info.get("ram"),
                        cpu_cores=device_info.get("cpu_cores"),
                        cpu_architecture=device_info.get("cpu_arch"),
                        gpu_info=device_info.get("gpu"),
                        device_os=device_info.get("os")
                    )
                    sender_email = os.getenv("EMAIL_SENDER")
                    if user_data["language"] == "es":
                        email_subject = "Hydrosyn: tu código de recuperación"
                        email_body = f"""
                        Hola,

                        Tu código de recuperación es: {code}

                        Este código expirará en 5 minutos.

                        IP de la solicitud: {request.client.host}
                        Dispositivo: {device_info.get("os") or 'Desconocido'}
                        """
                    else:
                            email_subject = "Hydrosyn: your recovery code"
                            email_body = f"""
                            Hello,

                            Your recovery code is: {code}

                            This code will expire in 5 minutes.

                            Request IP: {request.client.host}
                            Device: {device_info.get("os") or 'Unknown'}
                            """

                    send_success = send_email(
                        sender=sender_email,
                        to=user_data["email"],
                        subject=email_subject,
                        message_text=email_body
                    )
                two_token=generate_two_step_token(user_data["id"], request.state.session_id, twofa=user_data["use_2fa"])
                request.state.two_fa = True
                return templates.TemplateResponse("recovery-password-two", {
                    "request": request,
                    "texts": prefs["texts"],
                    "lang": prefs["lang"],
                    "theme": prefs["theme"],
                    "two_token": two_token
                })
                    
            



@router.get("/recover-password-two", response_class=HTMLResponse)
async def recover_password_two_get(request: Request,two_token: str = Query(...)):
    try:
        prefs = get_user_preferences(request)
    except ValueError as e:
        return PlainTextResponse(str(e), status_code=400)

    return templates.TemplateResponse("recover_password_two.html", {
        "request": request,
        "texts": prefs["texts"],
        "lang": prefs["lang"],
        "theme": prefs["theme"],
        "two_token": two_token
    })



@router.post("/recover-password-two", response_class=HTMLResponse)
async def recover_password_post(request: Request, email: str = Form(...)):
    try:
        prefs = get_user_preferences(request)
    except ValueError as e:
        return PlainTextResponse(str(e), status_code=400)
    
    # Aquí va la lógica para validar el email y enviar link de recuperación
    user_exists = await check_user_email_exists(email)  # función que debes implementar
    
    if user_exists:
        # Generar token, enviar email, etc.
        await send_password_recovery_email(email)  # función que debes implementar
        mensaje = prefs["texts"].get("recover_password_sent", "Se ha enviado un correo con instrucciones")
    else:
        mensaje = prefs["texts"].get("recover_password_error", "Email no encontrado")
    
    return templates.TemplateResponse("recover_password.html", {
        "request": request,
        "texts": prefs["texts"],
        "lang": prefs["lang"],
        "theme": prefs["theme"],
        "next_lang": prefs["next_lang"],
        "next_theme": prefs["next_theme"],
        "message": mensaje
    })

@router.get("/home", response_class=HTMLResponse)
async def home_get(request: Request):
    try:
        prefs = get_user_preferences(request)
    except ValueError as e:
        return PlainTextResponse(str(e), status_code=400)

    return templates.TemplateResponse("home.html", {
        "request": request,
        "texts": prefs["texts"],
        "lang": prefs["lang"],
        "theme": prefs["theme"],
      
    })


@router.post("/logout",  response_class=HTMLResponse)
async def logout(request: Request):
    delete_session_in_db(request.state.session_id)
    response = RedirectResponse(url="/web/auth/login", status_code=303)
    response.delete_cookie("session_id")
    return response