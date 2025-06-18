from fastapi import APIRouter, Request
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from utils import get_user_preferences 

router = APIRouter()
templates = Jinja2Templates(directory="app/templates")  # apunta a la carpeta correcta

@app.get("/")
async def welcome(request: Request):
    try:
        prefs = get_user_preferences(request)
    except ValueError as e:
        return PlainTextResponse(str(e), status_code=400)

    return templates.TemplateResponse("welcome.html", {
        "request": request,
        "texts": prefs["texts"],
        "lang": prefs["lang"],
        "theme": prefs["theme"],
        "next_lang": prefs["next_lang"],
        "next_theme": prefs["next_theme"],
    })
