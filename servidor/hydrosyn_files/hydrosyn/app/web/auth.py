from fastapi import APIRouter, Request
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from utils import get_user_preferences 
templates = Jinja2Templates(directory="app/templates")

router = APIRouter()

@router.get("/login", response_class=HTMLResponse)
async def login(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})

@router.get("/recover-password", response_class=HTMLResponse)
async def recover_password(request: Request):
    return templates.TemplateResponse("recover_password.html", {"request": request})
