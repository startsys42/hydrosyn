from fastapi import APIRouter, Request

from fastapi.responses import JSONResponse
from endpoints.utils import  ERROR_MESSAGES

from logger import logger
from security.csrf import generate_csrf_token, validate_and_remove_csrf_token
import os
from security.hash import hash_password, verify_password
from fastapi import Query
from security.password__name_validity import validate_username, validate_password
from security.email import send_email
from db.db_users import delete_session_in_db, is_in_blacklist_from_db, generate_unique_token_and_store_in_db
from pydantic import BaseModel, EmailStr
from security.two_steps import generate_two_step_token, validate_two_step_token , remove_two_step_token
from db.db_auth import get_user_login_from_db, get_admin_from_db, get_user_recovery_password_from_db, get_code_2fa_from_db, insert_new_session_in_db, delete_old_session_in_db, login_verify_language_theme_from_db, update_language_in_db, update_theme_in_db
from security.email_messages import email_login_error, generate_2fa_email, email_recovery_error, generate_new_password_email
from services.notifications import create_user_notification
from datetime import datetime, timezone
from security.same_device import hash_dict, sameDevice
class UserInput(BaseModel):
    email: EmailStr





router = APIRouter(tags=["Web Auth"])
# poenr los formualrios con campos dinamicos, si em logueo bien borrar sesiona nterior o registar el rpimer iniciod e sesion y tareas para el rpiemr usuaro iniciod e sesion notificacion

@router.post("/check-access")
async def check_access(request: Request):
    logger.info("Checking access for user")
    
        # quiero leer el json que recibe
   
    token= await generate_csrf_token()
    language = request.state.language or "en"
    theme = request.state.theme  or "light"
    if hasattr(request.state, "user_id"):
        name = request.state.change_name
        password = request.state.change_pass
        if await get_admin_from_db(request.state.user_id):
            admin = True
        else:
            admin = False
        return JSONResponse(
        status_code=200,
        content={
            "ok": True,
            "status": 200,
            "loggedIn": True,
            "changeName": name,
            "changePassword": password,
            "csrf": token,
            "language": language,
            "theme": theme,
            "permission": admin
        }
        )
    else:
        #insertar en login attempts
        return JSONResponse(
            status_code=200,
            content={
                "ok": True,
                "status": 200,
                "loggedIn": False,
                "csrf": token,
                "language": language,
                "theme": theme,
                "permission": False
            }
        )
    



@router.post("/login")
async def login(request: Request):
    logger.info("Checking login for user")
    
        # quiero leer el json que recibe, #valdiar lgitud
        #cmpruebo nombre , token csrfactibvo o no, blacklist , contraseña notificacion 2segudn avsio correo y dejo en el state   el nombre sie s correcto

    if await is_in_blacklist_from_db(request.state.json_data.get("username")):

        await create_user_notification(
            notification_id=5,  # ID de la notificación de bloqueo
            username=request.state.json_data.get("username"),
            ip=request.state.ip,
            date=request.state.date,
        )
        await validate_and_remove_csrf_token(request.state.json_data.get("csrf_token"))
        return JSONResponse(
            status_code=202,
            content={
                "ok": True,
                "status": 202,
                "language": request.state.language,
                "theme": request.state.theme,
                "message": "not"
            }
        )
    if not validate_username((request.state.json_data.get("username"))):
        await validate_and_remove_csrf_token(request.state.json_data.get("csrf_token"))
        return JSONResponse(
            status_code=202,
            content={
                "ok": True,
                "status": 202,
                "language": request.state.language,
                "theme": request.state.theme,
                "message": "not"
            }
        )

    data_login_db= await get_user_login_from_db(request.state.json_data.get("username"))
    if data_login_db is None:
        await validate_and_remove_csrf_token(request.state.json_data.get("csrf_token"))
        return JSONResponse(
            status_code=202,
            content={
                "ok": True,
                "status": 202,
                "language": request.state.language,
                "theme": request.state.theme,
                "message": "not"
            }
        )
    else:
        request.state.user_id = data_login_db["id"]
        if not validate_password(request.state.json_data.get("username"), request.state.json_data.get("password")):
            await email_login_error(
                email=data_login_db["email"],
                lang=data_login_db["language"],
                ip_address=request.state.ip
            )
            await validate_and_remove_csrf_token(request.state.json_data.get("csrf_token"))
            return JSONResponse(
                status_code=202,
                content={
                    "ok": True,
                    "status": 202,
                    "language": request.state.language,
                    "theme": request.state.theme,
                    "message": "not"
                }
            )
        if data_login_db["is_active"]==False:
            await create_user_notification(
                notification_id=7,  # ID de la notificación de cuenta inactiva
                username=request.state.json_data.get("username"),
                ip=request.state.ip,
                date=request.state.date,
            )
            await validate_and_remove_csrf_token(request.state.json_data.get("csrf_token"))
            return JSONResponse(
                status_code=202,
                content={
                    "ok": True,
                    "status": 202,
                    "language": request.state.language,
                    "theme": request.state.theme,
                    "message": "not"
                }
            )
        elif verify_password(request.state.json_data.get("password"),data_login_db["password"]):
            if not await validate_and_remove_csrf_token(request.state.json_data.get("csrf_token")):
                await email_login_error(
                    email=data_login_db["email"],
                    lang=data_login_db["language"],
                    ip_address=request.state.ip
                )
                return JSONResponse(
                        status_code=202,
                        content={
                            "ok": True,
                            "status": 202,
                            "language": request.state.language,
                            "theme": request.state.theme,
                            "message": "not"
                        }
                    )
            else:
                request.state.success = True
                #generar codigo envair email devolevrtoken...
                if not await generate_2fa_email( request.state.user_id,data_login_db["email"], request.state.language):  
                    return JSONResponse(
                        status_code=202,
                        content={
                            "ok": True,
                            "status": 202,
                            "language": request.state.language,
                            "theme": request.state.theme,
                            "message": "not"
                        }
                    )
                      
                token_2fa=generate_two_step_token(request.state.user_id, request.state.session_id, False)
                return JSONResponse(status_code=200,
                    content={
                        "ok": True,
                        "status": 200,
                        "2fa": token_2fa,
                        "language": request.state.language,
                        "theme": request.state.theme,
                        "message": "yes"
                      
                    }
                )
        else:
            await validate_and_remove_csrf_token(request.state.json_data.get("csrf_token"))
            await email_login_error(
                email=data_login_db["email"],
                lang=data_login_db["language"],
                ip_address=request.state.ip
            )
            return JSONResponse(
                status_code=202,
                content={
                    "ok": True,
                    "status": 202,
                    "language": request.state.language,
                    "theme": request.state.theme,
                    "message": "not"
                }
            )
            
        
    
    
     



@router.post("/recover-password")
async def recover_password(request: Request):
    logger.info("Recovering password for user")
    if await is_in_blacklist_from_db(request.state.json_data.get("username")):

        await create_user_notification(
            notification_id=6,  # ID de la notificación de bloqueo
            username=request.state.json_data.get("username"),
            ip=request.state.ip,
            date=request.state.date,
        )
        await validate_and_remove_csrf_token(request.state.json_data.get("csrf_token"))
        return JSONResponse(
            status_code=202,
            content={
                "ok": True,
                "status": 202,
                "language": request.state.language,
                "theme": request.state.theme,
                "message": "not"
            }
        )
    if not validate_username((request.state.json_data.get("username"))):
        await validate_and_remove_csrf_token(request.state.json_data.get("csrf_token"))
        return JSONResponse(
            status_code=202,
            content={
                "ok": True,
                "status": 202,
                "language": request.state.language,
                "theme": request.state.theme,
                "message": "not"
            }
        )
    data_login_db=await get_user_login_from_db(request.state.json_data.get("username")) 
   
    if data_login_db is None:
        await validate_and_remove_csrf_token(request.state.json_data.get("csrf_token"))
        return JSONResponse(
            status_code=202,
            content={
                "ok": True,
                "status": 202,
                "language": request.state.language,
                "theme": request.state.theme,
                "message": "not"
            }
        )
    else:
        data_recovery_db= await get_user_recovery_password_from_db(request.state.json_data.get("username"), request.state.json_data.get("email"))
        request.state.user_id = data_login_db["id"]
        if data_recovery_db is None and data_login_db["is_active"]==True:
            await email_recovery_error(
                email=data_login_db["email"],
                lang=data_login_db["language"],
                ip_address=request.state.ip
            )
            await validate_and_remove_csrf_token(request.state.json_data.get("csrf_token"))
            return JSONResponse(
                status_code=202,
                content={
                    "ok": True,
                    "status": 202,
                    "language": request.state.language,
                    "theme": request.state.theme,
                    "message": "not"
                }
            )
        elif data_recovery_db is None and data_login_db["is_active"]==False:
            await create_user_notification(
                    notification_id=8,  # ID de la notificación de cuenta inactiva
                    username=request.state.data.get("username"),
                    ip=request.state.ip,
                    date=request.state.date,
                )
            await validate_and_remove_csrf_token(request.state.json_data.get("csrf_token"))
            return JSONResponse(
                status_code=202,
                content={
                    "ok": True,
                    "status": 202,
                    "language": request.state.language,
                    "theme": request.state.theme,
                    "message": "not"
                }
            )
        else:
        
            if data_login_db["is_active"]==False:
                create_user_notification(
                    notification_id=8,  # ID de la notificación de cuenta inactiva
                    username=request.state.data.get("username"),
                    ip=request.state.ip,
                    date=request.state.date,
                )
                await validate_and_remove_csrf_token(request.state.json_data.get("csrf_token"))
                return JSONResponse(
                    status_code=202,
                    content={
                        "ok": True,
                        "status": 202,
                        "language": request.state.language,
                        "theme": request.state.theme,
                        "message": "not"
                    }
                )

            if not await validate_and_remove_csrf_token(request.state.json_data.get("csrf_token")):
                await email_recovery_error(
                    email=data_login_db["email"],
                    lang=data_login_db["language"],
                    ip_address=request.state.ip
                )
                return JSONResponse(
                        status_code=202,
                        content={
                            "ok": True,
                            "status": 202,
                            "language": request.state.language,
                            "theme": request.state.theme,
                            "message": "not"
                        }
                    )
            else:
                request.state.success = True
                #generar codigo envair email devolevrtoken...
                if not await generate_new_password_email( request.state.user_id,data_login_db["email"], data_login_db["username"], data_login_db["language"]) :
                    return JSONResponse(
                        status_code=202,
                        content={
                            "ok": True,
                            "status": 202,
                            "language": request.state.language,
                            "theme": request.state.theme,
                            "message": "not"
                        }
                    )
                    
                return JSONResponse(status_code=200,
                    content={
                        "ok": True,
                        "status": 200,
                        "language": request.state.language,
                        "theme": request.state.theme,
                        "message": "yes"

                    }
                )
            
        
@router.post("/code-2fa")
async def code_2fa(request: Request):
    token_2fa=validate_two_step_token(request.state.json_data.get("token_2fa"))
    if not token_2fa:
        return JSONResponse(
            status_code=202,
            content={
                "ok": True,
                "status": 202,
                "language": request.state.language,
                "theme": request.state.theme,
                "message": "not"
            }
        )
    else:
        request.state.user_id = token_2fa["user_id"]  
        if token_2fa["session_id"] != request.state.session_id:
         
            await remove_two_step_token(request.state.json_data.get("token_2fa"))
            return JSONResponse(
                status_code=202,
                content={
                    "ok": True,
                    "status": 202,
                    "language": request.state.language,
                    "theme": request.state.theme,
                    "message": "not"
                }
            )
        else:
            if await get_code_2fa_from_db(token_2fa["user_id"], request.state.json_data.get("code_2fa")):
                await delete_old_session_in_db(request.state.user_id)
                
                request.state.success = True
                await remove_two_step_token(request.state.json_data.get("token_2fa"))
                dict_summary = {
                    "userAgent": request.state.json_data.get("userAgent"),
                    "deviceMemory": request.state.json_data.get("deviceMemory"),
                    "cpuCores": request.state.json_data.get("cpuCores"),
                    "gpuInfo": request.state.json_data.get("gpuInfo"),
                    "os": request.state.json_data.get("os")
                }
                hash_summary=await hash_dict(dict_summary)
                await insert_new_session_in_db(request.state.user_id, request.state.session_id, request.state.json_data.get("userAgent"),
                        request.state.json_data.get("deviceMemory"),
                        request.state.json_data.get("cpuCores"),
                        request.state.json_data.get("gpuInfo"),
                        request.state.json_data.get("os"),
                        hash_summary
                    )
               

                verify_language_theme = await  login_verify_language_theme_from_db(request.state.user_id)
                if request.state.language != "en" and verify_language_theme["language"] != request.state.language:
                    await update_language_in_db(request.state.user_id, request.state.language)
                    
                elif request.state.language == "en" and verify_language_theme["language"] != request.state.language:
                    request.state.language = verify_language_theme["language"]
                    request.state.cookie = True
                    
                if request.state.theme != "light" and verify_language_theme["theme"] != request.state.theme:
                    await update_theme_in_db(request.state.user_id, request.state.theme)
                elif request.state.theme == "light" and verify_language_theme["theme"] != request.state.theme:
                    request.state.theme = verify_language_theme["theme"]
                    request.state.cookie = True
                

                admin = await get_admin_from_db(request.state.user_id)
                request.state.success = True
                # falta cerar historicod e cambair contraeña y ....
                return JSONResponse(
                    status_code=200,
                    content={
                        "ok": True,
                        "status": 200,
                        "language": request.state.language,
                        "theme": request.state.theme,
                        "message": "yes",
                        "admin": admin
                    }
                )

            else:
                return JSONResponse(
                    status_code=202,
                    content={
                        "ok": True,
                        "status": 202,
                        "language": request.state.language,
                        "theme": request.state.theme,
                        "message": "same"
                    }
                )
                
    #recieb token, comprueba,  y sie st bien borrar sesiones vieja regsitra login atemp exitoso y comp`ruebo verifys`


@router.post("/logout" )
async def logout(request: Request):
    delete_session_in_db(request.state.session_id)
    return JSONResponse(
        status_code=200,
        content={
            "ok": True,
            "status": 200,
            "language": "en",
            "theme": "light",
            

        }
    )
            


'''

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
    
    request.state.username = username
    request.state.date= datetime.now(timezone.utc)
   # aquid ebo guardar notificacion
    if await is_in_blacklist_from_db(username):
        request.state.blacklist = True
        create_user_notification(
            notification_id=5,  # ID de la notificación de bloqueo
            username=request.state.username,
            ip=request.client.host,
            date=request.state.date,
        )

        error_key = "account_not_exists"  # o "invalid_csrf"
        error_message = ERROR_MESSAGES[error_key][prefs["lang"]]
        return templates.TemplateResponse("login.html", {
            "request": request,
            "texts": prefs["texts"],
            "lang": prefs["lang"],
            "theme": prefs["theme"],
            "csrf_token":generate_csrf_token(),
            "error": error_message
        }, status_code=403)
    else:
        request.state.blacklist = False
       
    user_data = await get_user_login_from_db(username, password=password)
    
    if not user_data:
        request.state.user_exist = False
        error_key = "credentials"
        error_message = ERROR_MESSAGES[error_key][prefs["lang"]]
        return templates.TemplateResponse("login.html", {
            "request": request,
            "texts": prefs["texts"],
            "lang": prefs["lang"],
            "theme": prefs["theme"],
            "csrf_token": generate_csrf_token(),
            "error": error_message
        }, status_code=403)
    else:

        request.state.user_exist = True
        request.state.user_id = user_data["id"]
        request.state.email = user_data["email"]
        if user_data["is_active"]==True:
            request.state.is_active = True
        # si usuario cincide epro contraseña noe nvair emnsaje notifiacion
            if user_data["hash"]=="same":
                request.state.hash = True
                if not validate_csrf_token(csrf_token):
                    email_login_error(user_data["email"], user_data["language"], request.client.host)
                    request.state.csrf = False
                    error_key = "invalid_csrf"  # o "invalid_csrf"
                    error_message = ERROR_MESSAGES[error_key][prefs["lang"]]
                    return templates.TemplateResponse("login.html", {
                        "request": request,
                        "texts": prefs["texts"],
                        "lang": prefs["lang"],
                        "theme": prefs["theme"],
                        "csrf_token": generate_csrf_token(),
                        "error": error_message
                    }, status_code=403)
                else:
                    request.state.csrf = True
                    request.state.success = True
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
                email_login_error(user_data["email"], user_data["language"], request.client.host)
                request.state.hash = False
                error_key = "credentials"
                error_message = ERROR_MESSAGES[error_key][prefs["lang"]]
                return templates.TemplateResponse("login.html", {
                    "request": request,
                    "texts": prefs["texts"],
                    "lang": prefs["lang"],
                    "theme": prefs["theme"],
                    "csrf_token": generate_csrf_token(),
                    "error": error_message
                }, status_code=403)
        else:
            request.state.is_active = False
            create_user_notification(
                                                notification_id=7,  # ID de la notificación de cuenta inactiva
                                                username=request.state.username,
                                                ip=client_ip,
                                                date=request.state.date,
                                            )
            error_key = "credentials"
            error_message = ERROR_MESSAGES[error_key][prefs["lang"]]
            return templates.TemplateResponse("login.html", {
                "request": request,
                "texts": prefs["texts"],
                "lang": prefs["lang"],
                "theme": prefs["theme"],
                "csrf_token": generate_csrf_token(),
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
    request.state.username = username
    request.state.date= datetime.now(timezone.utc)
    if await is_in_blacklist_from_db(username):
        request.state.blacklist = True
      
        create_user_notification(
            notification_id=6,  # ID de la notificación de bloqueo
            username=request.state.username,
            ip=request.client.host,
            date=request.state.date,
        )
        error_key = "account_not_exists"  # o "invalid_csrf"
        error_message = ERROR_MESSAGES[error_key][prefs["lang"]]
        return templates.TemplateResponse("recover-password", {
            "request": request,
            "texts": prefs["texts"],
            "lang": prefs["lang"],
            "theme": prefs["theme"],
            "csrf_token": generate_csrf_token(),
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
            "csrf_token": generate_csrf_token(),
            "error": error_message
        }, status_code=403)
    else:
        request.state.user_id = user_data["id"]
        request.state.email = user_data["email"]
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
            create_user_notification(
                notification_id=8,  # ID de la notificación de cuenta inactiva
                username=request.state.username,
                ip=request.client.host,
                date=request.state.date,
            )
            request.state.is_active = False
        if request.state.user_exist==False or request.state.email_exist==False or request.state.is_active==False:
            if request.state.user_exist==False and request.state.email_exist==True:
                email_password_recovery_error(email, user_data["language"], request.client.host)
            elif request.state.email_exist==False and request.state.user_exist==True:
                email_password_recovery_error(user_data["email"], user_data["language"], request.client.host)
            error_key = "credentials"
            error_message = ERROR_MESSAGES[error_key][prefs["lang"]]
            return templates.TemplateResponse("recover-password", {
                "request": request,
                "texts": prefs["texts"],
                "lang": prefs["lang"],
                "theme": prefs["theme"],
                "csrf_token": generate_csrf_token(),
                "error": error_message
            }, status_code=403)
            
        else:
            if not validate_csrf_token(csrf_token):
                    request.state.csrf = False
                    email_password_recovery_error(email, user_data["language"], request.client.host)
                    error_key = "invalid_csrf"  # o "invalid_csrf"
                    error_message = ERROR_MESSAGES[error_key][prefs["lang"]]
                    return templates.TemplateResponse("recover-password", {
                        "request": request,
                        "texts": prefs["texts"],
                        "lang": prefs["lang"],
                        "theme": prefs["theme"],
                        "csrf_token": csrf_token,
                        "error": error_message
                    }, status_code=403)
            else:
                request.state.csrf = True
                request.state.success = True
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
        prefs = get_user_preferences(request) #AQUI DEBO GESTIOANR EL CAMBAIR IDIOAM TEMA , GUARDAR SESION CMABAIR CONTARSEÑA O NOMBRE FORZOSO, SOTRAR NOTIFICACIONES
    except ValueError as e:
        return PlainTextResponse(str(e), status_code=400)

    return templates.TemplateResponse("home.html", {
        "request": request,
        "texts": prefs["texts"],
        "lang": prefs["lang"],
        "theme": prefs["theme"],
      
    })


    '''