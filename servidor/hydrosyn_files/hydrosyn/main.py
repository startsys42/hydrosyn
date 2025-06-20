from fastapi import FastAPI
from fastapi import Request
from logger import logger 
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from starlette.middleware.sessions import SessionMiddleware
from security.claves import GestorClaves
from security.middleware import DualSessionMiddleware
from db.config import obtener_tiempo_rotacion_desde_bd


# Importamos routers
from app.web import auth as web_auth
from app.web import views as web_views
from app.api import auth as api_auth
from app.api import users as api_users

ruta_k_bd = "/etc/hydrosyn/session.key"

def cargar_clave_maestra():
    if not os.path.exists(ruta_k_bd):
        logger.error(f"Clave maestra no encontrada en {ruta_k_bd}. Abortando.")
        sys.exit(1)

    with open(ruta_k_bd, "r") as f:
        km = f.read().strip()

    if not km:
        logger.error(f"Clave maestra en {ruta_k_bd} está vacía. Abortando.")
        sys.exit(1)

    try:
        os.remove(ruta_k_bd)
    except Exception as e:
        logger.warning(f"No se pudo borrar el fichero clave maestra: {e}")

    logger.info("Clave maestra cargada correctamente y fichero borrado.")
    return km

km = cargar_clave_maestra()


# Función para leer la clave secreta del fichero
'''
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
'''


gestor_claves = GestorClaves(
    obtener_tiempo_rotacion=obtener_tiempo_rotacion_desde_bd,
    ttl=600  # 10 minutos
)


app = FastAPI()

# 1) Middleware para sesiones (solo para rutas web) con la clave cargada desde shadow
#app.add_middleware(SessionMiddleware, secret_key=secret_key)

app.add_middleware(DualSessionMiddleware, gestor_claves=gestor_claves)



# Middleware personalizado con rotación de clave
app.add_middleware(DualSessionMiddleware, gestor_claves=gestor_claves)

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

logger.info("La aplicación FastAPI ha arrancado")
