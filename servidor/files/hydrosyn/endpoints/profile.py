from fastapi import APIRouter, Request
from security.csrf import generate_csrf_token, validate_and_remove_csrf_token
from db.db_users import  is_in_blacklist_from_db

from fastapi.responses import JSONResponse
from servidor.files.hydrosyn.security.email_messages import generate_2fa_email
from security.password__name_validity import validate_password, validate_username 
from security.two_steps import generate_two_step_token, validate_two_step_token , remove_two_step_token
from servidor.files.hydrosyn.security.hash import verify_password
router = APIRouter()
#  cambair idioma, cambiar contarseña, activar twofa, desativar twofa, actiavr  , ver correo. o inidcarloe n lso emnsajes



# Endpoints para cambiar nombre
@router.post("/change-name")
async def change_name(request: Request):
    # recibe el nombre valido sie s valdio, devuelvo 2fa y verifico
    request.state.json_data = await request.json() if request.method == "POST" else {}
    if not await validate_and_remove_csrf_token(request.state.json_data.get("csrf_token")):
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
    if await is_in_blacklist_from_db(request.state.json_data.get("username")):
    
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
      
        if not await generate_2fa_email( request.state.user_id,request.state.email, request.state.language):
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
                "username": request.state.json_data.get("username"),
                "language": request.state.language,
                "theme": request.state.theme,
                "message": "yes"
                
            }
        )
           


@router.post("/change-password")
async def change_password(request: Request):
    # copruebo nueva y vueja contraseñaa, devuelvo 2fa y evriico
    request.state.json_data = await request.json() if request.method == "POST" else {}
    if not await validate_and_remove_csrf_token(request.state.json_data.get("csrf_token")):
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
    if request.state.json_data.get("new_password") != request.state.json_data.get("confirm_new_password"):
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
    if not validate_password(request.state.username,request.state.json_data.get("new_password")):

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
    if verify_password(request.state.json_data.get("password"),request.state.password):
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
      
        if not await generate_2fa_email( request.state.user_id,request.state.email, request.state.language):
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
                "password": request.state.json_data.get("new_password"),
                "language": request.state.language,
                "theme": request.state.theme,
                "message": "yes"
                
            }
        )

    





@router.post("/change-email")
async def change_email(request: Request):
    #AQUI TENGO QUE VALDIAR EL EMAIL VIEJO Y EL NUEVO
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



