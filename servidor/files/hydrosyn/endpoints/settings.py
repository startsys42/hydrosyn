from fastapi import APIRouter, Request, Form
from fastapi.responses import RedirectResponse
from urllib.parse import urlparse
from db.db_users import update_user_preferences_in_db, get_user_id_from_db
from logger import logger

router = APIRouter(tags=["Web Settings"])

@router.post("/change-language-theme")
async def change_lang_theme_post(
     request: Request,
    type: str,  # "idioma" o "tema"
    value: str  # "es", "en", "light", "dark"
):

    cookie_value = request.cookies.get("hydrosyn_session_id")
    if not cookie_value:
          return JSONResponse(
            {"error": "NO cookie found"}, 
            status_code=400
        )

    #request.state.lang = lang
    #request.state.theme = theme
    
    user_id=get_user_id_from_db(request.state.session_id)
    if user_id:
        # Actualizar preferencias del usuario en la base de datos
        await update_user_preferences_in_db(user_id, lang, theme)
    


    # se comprueba si existe sesion cookie , se cambia en la base de datos, se comprueba el next y se envia al siguiente endpoint