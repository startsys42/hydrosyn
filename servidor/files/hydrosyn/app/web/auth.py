from fastapi import APIRouter, Request
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from app.web.utils import get_user_preferences
from fastapi.responses import PlainTextResponse
from fastapi import Form, status
from fastapi.responses import RedirectResponse
from common.templates import templates
from logger import logger
from security.csrf import generate_csrf_token
from db.db_notifications import get_should_send_email_for_notification_from_db, get_notifications_email_from_db


router = APIRouter(tags=["Web Auth"])
# poenr los formualrios con campos dinamicos

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
async def login_post(request: Request, username: str = Form(...), password: str = Form(...), csrf_token: str = Form(...)):
    try:
        prefs = get_user_preferences(request)
    except ValueError as e:
        return PlainTextResponse(str(e), status_code=400)

    # Validar CSRF primero
    if not validate_csrf_token(csrf_token):
        return templates.TemplateResponse("login.html", {
            "request": request,
            "texts": prefs["texts"],
            "lang": prefs["lang"],
            "theme": prefs["theme"],
            "error": "Invalid CSRF token"
        }, status_code=403)

    # 1. Verificar lista negra
    if await is_in_blacklist_from_db(username):
        # Obtener configuración de notificación
        should_send = await get_should_send_email_for_notification_from_db(5)  # ID 5 = lista negra
        
        if should_send and should_send['should_send_email']:
            # Obtener email y plantilla
            notification_email, notification_lang = await get_notifications_email_from_db()
            if notification_email:
                template = await get_notification_template_from_db(
                    notification_id=5,
                    lang_code=notification_lang
                )
                
                if template:
                    client_ip = request.client.host if request.client else "unknown"
                    formatted_msg = template['template_text'].format(
                      
                        user=username,
                        ip=client_ip
                   
                    )
                    
                    # Enviar email
                    send_email(
                        to=notification_email,
                        subject=template['subject'],
                        body=formatted_msg
                    )
        
        # Registrar notificación para admin
        await create_user_notification(
            user_id=1,  # ID admin
            notification_id=5,
            username=username,
            ip=request.client.host if request.client else "unknown",
            lang=prefs['lang']
        )
        
        return templates.TemplateResponse("login.html", {
            "request": request,
            "texts": prefs["texts"],
            "lang": prefs["lang"],
            "theme": prefs["theme"],
            "error": "Account restricted"
        }, status_code=403)

    # 2. Verificar credenciales
    user_data = await get_user_login_from_db(username=username, password=password)
    
    if not user_data:
        return templates.TemplateResponse("login.html", {
            "request": request,
            "texts": prefs["texts"],
            "lang": prefs["lang"],
            "theme": prefs["theme"],
            "error": "Invalid credentials",
            "csrf_token": generate_csrf_token()
        }, status_code=400)

    # 3. Verificar estado de cuenta
    if not user_data.get("is_active", False):
        return templates.TemplateResponse("login.html", {
            "request": request,
            "texts": prefs["texts"],
            "lang": prefs["lang"],
            "theme": prefs["theme"],
            "error": "Account not activated",
            "csrf_token": generate_csrf_token()
        }, status_code=403)

    # 4. Si requiere 2FA
    if user_data.get("use_2fa", False):
        # Guardar sesión temporal y redirigir a 2FA
        session_token = await create_temp_session(user_data['id'])
        response = RedirectResponse(url="/two-factor", status_code=303)
        response.set_cookie("2fa_session", session_token, httponly=True, secure=True)
        return response

    # 5. Login exitoso
    session_id = await create_user_session(user_data['id'])
    response = RedirectResponse(url="/dashboard", status_code=303)
    response.set_cookie("session", session_id, httponly=True, secure=True)
    return response



    
    
    try:
        prefs = get_user_preferences(request)
    except ValueError as e:
        return PlainTextResponse(str(e), status_code=400)
# comprobar cuenta no bloqueada, comprobar usuario existe, comprobar nomber no lista negra, comprobar usuario activado o no o comoe sta su sistuacion,... comprobar cumple reglas contraseña y nombe... # email_verifiacion

## notificacion, errore en pagina e idioma , login attempt
    if await is_in_blacklist_from_db(username):
         notification = await get_should_send_email_for_notification_from_db(5)
        
        # 2. Si está activo el envío por email
        if notification['should_send_email']:
            notification_email, notification_lang = get_notifications_email_from_db() 
            # Obtener plantilla en el idioma correcto
           template = await get_notification_template_from_db(
        notification_id=5,
        lang_code=notification_lang
    )
    
            # Formatear mensaje
            formatted_email = template['template_text'].format(
                usuario=username,
                user=username,
                ip=ip,
                fecha=datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            )
            
            # Obtener email de administración
            
            
            # Enviar email
            send_email(
                to=admin_email,
                subject=template['subject'],
                body=formatted_email
            )
        
        # 3. Registrar notificación para el usuario 1 (admin) en cualquier caso
        await create_user_notification(
            user_id=1,  # ID del usuario admin
            notification_id=5,
            username=username,
            ip=ip,
            lang=prefs['lang']
        )
        return templates.TemplateResponse("login.html", {
            "request": request,
            "texts": prefs["texts"],
            "lang": prefs["lang"],
            "theme": prefs["theme"],
            "error": "Account restricted"
        }, status_code=403)
## notificacion, errore en pagina e idioma , login attempt
     if not validate_csrf_token(csrf_token):
        return templates.TemplateResponse("login.html", {
            "request": request,
            "texts": prefs["texts"],
            "lang": prefs["lang"],
            "theme": prefs["theme"],
            "error": "Invalid CSRF token"
        }, status_code=403)


   user_data = await get_user_login_from_db(username=username, password=password)

## notificacion, errore en pagina e idioma , login attempt
if not user_data["is_active"]:
        return templates.TemplateResponse("login.html", {
            "request": request,
            "texts": prefs["texts"],
            "lang": prefs["lang"],
            "theme": prefs["theme"],
            "error": "Account not activated"
        }, status_code=403)
##comprobar contraseña
##comprobar 2fa

    if not user_data:
        return templates.TemplateResponse("login.html", {
            "request": request,
            "texts": prefs["texts"],
            "lang": prefs["lang"],
            "theme": prefs["theme"],
            "error": "Invalid credentials",
            "csrf_token": generate_csrf_token()  # Generar nuevo token para reintento
        }, status_code=400)

 
    
    return response








@router.get("/login-two", response_class=HTMLResponse)
async def login_get(request: Request):
    try:
        prefs = get_user_preferences(request)
    except ValueError as e:
        return PlainTextResponse(str(e), status_code=400)

    return templates.TemplateResponse("login.html", {
        "request": request,
        "texts": prefs["texts"],
        "lang": prefs["lang"],
        "theme": prefs["theme"],
      
    })

@router.post("/login-two", response_class=HTMLResponse)
async def login_post(request: Request, username: str = Form(...), password: str = Form(...)):
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

    return templates.TemplateResponse("recover_password.html", {
        "request": request,
        "texts": prefs["texts"],
        "lang": prefs["lang"],
        "theme": prefs["theme"],
        "csrf_token": csrf_token
    })


@router.post("/recover-password", response_class=HTMLResponse)
async def recover_password_post(request: Request,username: str = Form(...), email: str = Form(...)):
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



@router.get("/recover-password-two", response_class=HTMLResponse)
async def recover_password_get(request: Request):
    try:
        prefs = get_user_preferences(request)
    except ValueError as e:
        return PlainTextResponse(str(e), status_code=400)

    return templates.TemplateResponse("recover_password.html", {
        "request": request,
        "texts": prefs["texts"],
        "lang": prefs["lang"],
        "theme": prefs["theme"],
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
async def login_get(request: Request):
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
