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
async def login_post(request: Request, username: str = Form(...), password: str = Form(...)):
    try:
        prefs = get_user_preferences(request)
    except ValueError as e:
        return PlainTextResponse(str(e), status_code=400)
# comprobar cuenta no bloqueada, comprobar usuario existe, comprobar nomber no lista negra, comprobar usuario activado o no o comoe sta su sistuacion,... comprobar cumple reglas contraseña y nombe... # email_verifiacion
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
        
        }, status_code=400)









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
