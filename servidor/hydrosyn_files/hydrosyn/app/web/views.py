from fastapi import APIRouter, Request
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse

router = APIRouter()
templates = Jinja2Templates(directory="app/templates")  # apunta a la carpeta correcta

@router.get("/", response_class=HTMLResponse)
async def landing(request: Request, lang: str = "en"):
    texts = {
        "login": "Login" if lang == "en" else "Iniciar sesión",
        "change_lang": "Change language" if lang == "en" else "Cambiar idioma",
        "forgot": "Recovery password" if lang == "en" else "Recuperar contraseña"
    }
    next_lang = "es" if lang == "en" else "en"
    return templates.TemplateResponse("welcome.html", {
        "request": request,
        "texts": texts,
        "next_lang": next_lang,
        "lang": lang
    })
