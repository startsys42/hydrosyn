from fastapi import FastAPI
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

    # Cada línea: username:$hash:timestamp
    # Ejemplo: "user1:$6$salt$hashedpass:1686574800"
    # Queremos la línea con el timestamp más alto
    ultima_linea = max(lines, key=lambda l: int(l.strip().split(":")[-1]))
    partes = ultima_linea.strip().split(":")
    clave = partes[1]  # la parte cifrada (hash)
    return clave


# Aquí cargas la clave secreta **antes** de crear el app
secret_key = obtener_clave_secreta_de_shadow("session.shadow")

app = FastAPI()

# 1) Middleware para sesiones (solo para rutas web) con la clave cargada desde shadow
app.add_middleware(SessionMiddleware, secret_key=secret_key)


# 1) Middleware para sesiones (solo para rutas web)
app.add_middleware(SessionMiddleware, secret_key="UNA_CLAVE_SECRETA_Y_LARGA")

# 2) Montar carpeta de archivos estáticos y plantillas (clientes web)
app.mount("/static", StaticFiles(directory="app/static"), name="static")
templates = Jinja2Templates(directory="app/templates")

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
