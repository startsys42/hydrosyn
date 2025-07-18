
from fastapi import APIRouter, Request
router = APIRouter()

# crear susuario , borarr usuario, desactivar usuario, cambairle contraseña o correo o 2fa
# protlongar autentificar  o or ecuperar contraseña extender tiempo recuepracion oa activacion
#listar permisos roles istemas, listar usuarios, modificar usuario, ver ordenes

@router.get("/create-user")
async def create_user_get():
    return {"action": "get create user form"}

@router.post("/create-user")
async def create_user_post():
    return {"action": "process create user"}

@router.get("/delete-user")
async def delete_user_get():
    return {"action": "get delete user form"}

@router.post("/delete-user")
async def delete_user_post():
    return {"action": "process delete user"}

@router.get("/change-user-password")
async def change_user_password_get():
    return {"action": "get change password form"}

@router.post("/change-user-password")
async def change_user_password_post():
    return {"action": "process password change"}



@router.get("/change-user-email")
async def change_user_email_get():
    return {"action": "get change email form"}

@router.post("/change-user-email")
async def change_user_email_post():
    return {"action": "process email change"}