
from fastapi import APIRouter, Request
router = APIRouter()

# crear susuario , borarr usuario, desactivar usuario, cambairle contraseña o correo o 2fa
# protlongar autentificar  o or ecuperar contraseña extender tiempo recuepracion oa activacion
#listar permisos roles istemas, listar usuarios

@router.get("/create-user")
async def change_name_get():
    return {"action": "get name change form"}

@router.post("/create-user")
async def change_name_post():
    return {"action": "process name change"}

@router.get("/delete-user")
async def change_name_get():
    return {"action": "get name change form"}

@router.post("/delete-user")
async def change_name_post():
    return {"action": "process name change"}
