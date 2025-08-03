
# cambair contraseña suaurio db
# reajsutar db, alerat notificacionc apacidad

#extender tiempo suaurios login o recueparrc ontarseña ver logs
# añadir nombre a la lista negra
# estadisticas y cosas
# borra sesionde usaurios ald esactivar
# seguridad contraseñas y  seguridad  nombres
#notificacioens
# extender epriodos

#ber posy y añadir

from db.db_users import get_blacklist_from_db
from fastapi import APIRouter, Request, Depends
from fastapi.responses import JSONResponse, HTMLResponse
from db.db_auth import get_admin_from_db
from security.csrf import generate_csrf_token


router = APIRouter(tags=['Web Security'])

@router.get("/blacklist")
async def see_blacklist_get(request: Request):

    
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
                    "loggedIn": False,
                    "csrf": token,
                    "language": language,
                    "theme": theme,
                    "permission": False
                }
            )
        list_blacklist = await get_blacklist_from_db()
        return JSONResponse(
            status_code=200,
            content={
                "ok": True,
                "status": 200,
                "loggedIn": True,

                "csrf": token,
                "language": language,
                "theme": theme,
                "permission": admin,
                'blacklist': list_blacklist
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
    



    
    
