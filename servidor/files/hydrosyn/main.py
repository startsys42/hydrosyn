from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import os
import sys
from logger import logger
from security.secrets import get_most_recent_password, load_master_data
from common.keys_managers import cookie_key_manager, jwt_key_manager
from db.db_config import get_cookie_rotation_time_from_db, get_old_cookie_token_limit_hour_from_db, get_jwt_rotation_time_from_db
from db.db_engine import DBEngine
from security.middleware_web import AdvancedSessionMiddleware
from dotenv import load_dotenv
from security.keys import JWTKeyManager
from events.startup import on_startup
from fastapi.responses import RedirectResponse


# Importamos routers
from app.web import auth as web_auth
from app.web import config as web_config
from app.web import profile as web_profile
from app.web import permissions as web_permissions
from app.web import users as web_users
from app.web import device as web_device

from app.api import auth as api_auth
from app.api import users as api_users


load_dotenv(".env")


user_shadow_path = "/var/lib/hydrosyn/user_db.shadow"
k_db_path = "/var/lib/hydrosyn/session.key"



km, db_port = load_master_data(k_db_path)




# Puedes leer el resto de valores como quieras (desde archivo, variables de entorno, etc.)
db_user = os.getenv("DB_USER")
db_host = os.getenv("DB_HOST")
db_name = os.getenv("DB_NAME")
password  = get_most_recent_password(user_shadow_path, km)

logger.info(f"Conectando a BD con: usuario={db_user}, password={'***' if password else 'VACÍO'}, host={db_host}, puerto={db_port}, bd={db_name}")


try:
    DBEngine.initialize_engine(db_user, password, db_host, db_port, db_name)
except Exception as e:
    logger.error(f"Error initializing DB engine: {e}")
    sys.exit(1)


# Función para leer la clave secreta del fichero





#cookie_key_manager = CookieKeyManager(get_rotation_time=get_cookie_rotation_time_from_db,get_grace_period = get_old_cookie_token_limit_hour_from_db,ttl=600  # 10 minutes )




#jwt_key_manager = JWTKeyManager(get_rotation_time=get_jwt_rotation_time_from_db, get_grace_period = get_old_cookie_token_limit_hour_from_db,ttl=600)

app = FastAPI()

# 1) Middleware para sesiones (solo para rutas web) con la clave cargada desde shadow






# Middleware personalizado con rotación de clave
app.add_middleware(AdvancedSessionMiddleware, key_manager=cookie_key_manager)

# 2) Montar carpeta de archivos estáticos y plantillas (clientes web)
app.mount("/static", StaticFiles(directory="app/static"), name="static")
templates = Jinja2Templates(directory="app/templates")


@app.get("/")
async def root_redirect():
    """Redirige la raíz a la página de login."""
    
    # Asumiendo que tu login está en /web/auth/
    return RedirectResponse(url="/web/auth/login", status_code=302)




# 3) Rutas Web (HTML + sesiones)
#    - web_auth.router: login, logout, formulario, etc.
#    - web_views.router: páginas protegidas (home, dashboard, etc.)
app.include_router(web_auth.router, prefix="/web/auth", tags=["Web Auth"])
app.include_router(web_config.router, prefix="/web/config", tags=["Web Config"])
app.include_router(web_profile.router, prefix="/web/profile", tags=["Web Profile"])
app.include_router(web_permissions.router, prefix="/web/permissions", tags=["Web Permissions"])
app.include_router(web_users.router, prefix="/web/users", tags=["Web Users"])
app.include_router(web_device.router, prefix="/web/device", tags=["Web Device"])

# 4) Rutas API (JSON + JWT)
#    - api_auth.router: /api/token, validación de credenciales, emisión de JWT
#    - api_users.router: /api/users, endpoints protegidos por token
app.include_router(api_auth.router, prefix="/api", tags=["API"])
app.include_router(api_users.router, prefix="/api", tags=["API"])

logger.info("Starting application...")

@app.on_event("startup")
async def startup_event():
    await on_startup()



