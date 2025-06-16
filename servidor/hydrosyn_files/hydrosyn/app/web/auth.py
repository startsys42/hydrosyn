from fastapi import APIRouter, Request
from fastapi.templating import Jinja2Templates

router = APIRouter()
templates = Jinja2Templates(directory="app/templates")

@router.get("/login")
async def mostrar_login(request: Request):
    return templates.TemplateResponse("login_en.html", {"request": request})

@router.get("/recover")
async def recover_password(request: Request):
    return templates.TemplateResponse("recover.html", {"request": request})
