from fastapi import APIRouter, Request, Form
from fastapi.responses import RedirectResponse
from urllib.parse import urlparse
from db.db_users import update_user_preferences_in_db, get_user_id_from_db
from logger import logger

router = APIRouter(tags=["Web Settings"])

@router.post("/change-lang-theme")
async def change_lang_theme_post(
    request: Request,
    lang: str = Form(...),
    theme: str = Form(...),
    next: str = Form(None)
):

    cookie_value = request.cookies.get("hydrosyn_session_id")
    if not cookie_value:
        raise HTTPException(
            status_code=401,  # or 400 if you prefer
            detail="Session cookie not found"
        )

    request.state.lang = lang
    request.state.theme = theme
    
    user_id=get_user_id_from_db(request.state.session_id)
    if user_id:
        # Actualizar preferencias del usuario en la base de datos
        await update_user_preferences_in_db(user_id, lang, theme)
    
    if next=="/web/login":
        logger.info("llegue al redirect login de settings")
        return RedirectResponse(url="/web/login", status_code=303)
    elif next=="/web/recover-password":
        return RedirectResponse(url="/web/recover-password", status_code=303)

    # se comprueba si existe sesion cookie , se cambia en la base de datos, se comprueba el next y se envia al siguiente endpoint