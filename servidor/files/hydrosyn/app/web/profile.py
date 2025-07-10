from fastapi import APIRouter, Request
router = APIRouter()
# cambair nombre, cambair idioma, cambiar contarseña, activar twofa, desativar twofa, actiavr  , cambair correo
@app.post("/change-name")
async def change_name():
    ...

@app.post("/change-email")
async def change_email():
    ...

@app.post("/change-language")
async def change_language():
    ...

@app.post("/change-theme")
async def change_theme():
    ...

@app.post("/change-password")
async def change_password():
    ...

@app.post("/activate-2fa")
async def activate_2fa():
    ...

@app.post("/deactivate-2fa")
async def deactivate_2fa():
