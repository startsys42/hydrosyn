from fastapi import APIRouter, Request 
from fastapi.responses import JSONResponse
from db.db_users import update_user_preferences_in_db, get_user_id_from_db
from logger import logger


router = APIRouter(tags=["Web Settings"])

@router.post("/change-language-theme")
async def change_lang_theme_post(request: Request):
   

    cookie_value = request.cookies.get("hydrosyn_session_id")
    type = request.state.json_data.get("type")
    value = request.state.json_data.get("value")
    logger.info("Changing language or theme")
    logger.info(f"Type: {type}, Value: {value}")
    if not cookie_value:
          return JSONResponse(
            status_code=401,
                        content={
                            "ok": False,
                            "status": 401,
                            "message": "Session expired or invalid, please login again",

                        }
        )

    if type == "language":
         request.state.language = value
    elif type == "theme":
        request.state.theme = value

    user_id = get_user_id_from_db(request.state.session_id)
    if user_id:
        logger.info(f"User ID found: {user_id}, updating preferences")
        await update_user_preferences_in_db(user_id, type, value)
    


    # se comprueba si existe sesion cookie , se cambia en la base de datos, se comprueba el next y se envia al siguiente endpoint