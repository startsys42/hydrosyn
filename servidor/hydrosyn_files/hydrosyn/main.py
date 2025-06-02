from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from app.api import users as api_users
from app.web import views as web_views

app = FastAPI(title="Mi Proyecto", version="1.0")

# Montar carpeta de archivos estáticos
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# Cargar plantillas Jinja2 (para frontend web)
templates = Jinja2Templates(directory="app/templates")

# Incluir rutas de API (para React Native, etc.)
app.include_router(api_users.router, prefix="/api", tags=["API"])

# Incluir rutas de vistas web (para navegador)
app.include_router(web_views.router, tags=["Web"])
