from fastapi import APIRouter, Request
from app.web.utils import get_user_preferences
from security.csrf import generate_csrf_token
from common.templates import templates
from fastapi.responses import HTMLResponse, PlainTextResponse
router = APIRouter()
#  cambair idioma, cambiar contarseña, activar twofa, desativar twofa, actiavr  , ver correo. o inidcarloe n lso emnsajes



# Endpoints para cambiar nombre
@router.get("/change-name", response_class=HTMLResponse)
async def change_name_get(requqest: Request):
    try:
        prefs = get_user_preferences(request)
        csrf_token = generate_csrf_token()
    except ValueError as e:
        return PlainTextResponse(str(e), status_code=400)

    return templates.TemplateResponse("name.html", {
        "request": request,
        "texts": prefs["texts"],
        "lang": prefs["lang"],
        "theme": prefs["theme"],
        "csrf_token": csrf_token
    })


@router.get("/change-password", response_class=HTMLResponse)
async def change_password_get(request: Request):
    try:
        prefs = get_user_preferences(request)
        csrf_token = generate_csrf_token()
    except ValueError as e:
        return PlainTextResponse(str(e), status_code=400)

    return templates.TemplateResponse("password.html", {
        "request": request,
        "texts": prefs["texts"],
        "lang": prefs["lang"],
        "theme": prefs["theme"],
        "csrf_token": csrf_token
    })

    





@router.post("/change-name")
async def change_name_post():
    return {"action": "process name change"}

# Endpoints para cambiar email



@router.post("/change-email")
async def change_email_post():
    return {"action": "process email change"}





@router.post("/change-password")
async def change_password_post():
    return {"action": "process password change"}





