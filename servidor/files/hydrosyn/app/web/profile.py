from fastapi import APIRouter, Request
router = APIRouter()
#  cambair idioma, cambiar contarseña, activar twofa, desativar twofa, actiavr  , ver correo. o inidcarloe n lso emnsajes

def generate_secure_totp_secret():
    # Alfabeto Base32 oficial (mayúsculas + 2-7)
    alphabet = string.ascii_uppercase + "234567"
    return ''.join(secrets.choice(alphabet) for _ in range(32))

# Endpoints para cambiar nombre
@router.get("/change-name")
async def change_name_get():
    return {"action": "get name change form"}

@router.post("/change-name")
async def change_name_post():
    return {"action": "process name change"}

# Endpoints para cambiar email
@router.get("/change-email")
async def change_email_get():
    return {"action": "get email change form"}

@router.post("/change-email")
async def change_email_post():
    return {"action": "process email change"}

# Endpoints para cambiar idioma
@router.get("/change-language")
async def change_language_get():
    return {"action": "get language options"}

@router.post("/change-language")
async def change_language_post():
    return {"action": "process language change"}

# Endpoints para cambiar tema
@router.get("/change-theme")
async def change_theme_get():
    return {"action": "get theme options"}

@router.post("/change-theme")
async def change_theme_post():
    return {"action": "process theme change"}

# Endpoints para cambiar contraseña
@router.get("/change-password")
async def change_password_get():
    return {"action": "get password change form"}

@router.post("/change-password")
async def change_password_post():
    return {"action": "process password change"}






@router.get("/activate-2fa")
async def activate_2fa_get():
    return {"action": "activate 2fa"}

@router.get("/deactivate-2fa")
async def deactivate_2fa_get():
    return {"action": "deactivate 2fa"}
