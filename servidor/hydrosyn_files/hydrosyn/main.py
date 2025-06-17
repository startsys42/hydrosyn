from fastapi import FastAPI
from fastapi import Request

from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from starlette.middleware.sessions import SessionMiddleware

# Importamos routers
from app.web import auth as web_auth
from app.web import views as web_views
from app.api import auth as api_auth
from app.api import users as api_users

# Función para leer la clave secreta del fichero
def obtener_clave_secreta_de_shadow(ruta_fichero: str) -> str:
    with open(ruta_fichero, "r") as f:
        lines = f.readlines()

  

    # Cada línea: hash:salt:timestamp
    # Ejemplo: "hashedpass:somesalt:1686574800"
    # Queremos la línea con el timestamp más alto
    ultima_linea = max(lines, key=lambda l: int(l.strip().split(":")[-1]))
    partes = ultima_linea.strip().split(":")
    clave = partes[0]  # hash
    return clave


# Aquí cargas la clave secreta **antes** de crear el app
secret_key = obtener_clave_secreta_de_shadow("/etc/hydrosyn/session.shadow")


app = FastAPI()

# 1) Middleware para sesiones (solo para rutas web) con la clave cargada desde shadow
app.add_middleware(SessionMiddleware, secret_key=secret_key)



# 2) Montar carpeta de archivos estáticos y plantillas (clientes web)
app.mount("/static", StaticFiles(directory="app/static"), name="static")
templates = Jinja2Templates(directory="app/templates")


LANGS = {
    "es": {
        "title": "¡Bienvenid@!",
        "login": "Iniciar sesión",
        "change_lang": "Cambiar idioma",
        "change_theme": "Cambiar tema",
        "forgot": "Recuperar contraseña",
    },
    "en": {
        "title": "Welcome!",
        "login": "Login",
        "change_lang": "Change language",
        "change_theme": "Change theme",
        "forgot": "Recover password",
    }
}
allowed_langs = ["es", "en"]
allowed_themes = ["light", "dark"]

# --- NUEVA RUTA PARA EL MENÚ INICIAL ---
# Esta ruta se encargará de mostrar la página principal con los botones de acceso.
@app.get("/")
async def welcome(request: Request):
    # Leer idioma y tema de query params o sesión
    lang = request.query_params.get("lang") or request.session.get("lang") or "es"
    theme = request.query_params.get("theme") or request.session.get("theme") or "light"
    if lang not in allowed_langs:
        lang = request.session.get("lang") or "es"
    if theme not in allowed_themes:
        theme = request.session.get("theme") or "light"
    # Guardar en sesión
    request.session["lang"] = lang
    request.session["theme"] = theme

    next_lang = "en" if lang == "es" else "es"
    next_theme = "dark" if theme == "light" else "light"

    texts = LANGS.get(lang, LANGS["es"])

    return templates.TemplateResponse("welcome.html", {
        "request": request,
        "texts": texts,
        "next_lang": next_lang,
        "theme": theme,
        "next_theme": next_theme
    })
# -------------------------------------



# 3) Rutas Web (HTML + sesiones)
#    - web_auth.router: login, logout, formulario, etc.
#    - web_views.router: páginas protegidas (home, dashboard, etc.)
app.include_router(web_auth.router, tags=["Web"])
app.include_router(web_views.router, tags=["Web"])

# 4) Rutas API (JSON + JWT)
#    - api_auth.router: /api/token, validación de credenciales, emisión de JWT
#    - api_users.router: /api/users, endpoints protegidos por token
app.include_router(api_auth.router, prefix="/api", tags=["API"])
app.include_router(api_users.router, prefix="/api", tags=["API"])
