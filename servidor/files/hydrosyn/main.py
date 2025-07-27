
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
import os
import sys
from logger import logger
from security.secrets import get_most_recent_password, load_master_data
from common.keys_managers import cookie_key_manager #, jwt_key_manager
from db.db_config import get_cookie_rotation_time_from_db, get_old_cookie_token_limit_hour_from_db
from db.db_engine import DBEngine
from security.middleware import AdvancedSessionMiddleware
from dotenv import load_dotenv
from services.notifications import create_user_notification
from events.startup import on_startup
from fastapi.middleware.cors import CORSMiddleware


from datetime import datetime, timezone
# Importamos routers
from endpoints import (
    auth as web_auth,
    config as web_config,
    profile as web_profile,
    users as web_users,
    device as web_device,
    settings as web_settings
)
from services.notifications import create_user_notification

#from app.api import auth as api_auth
#from app.api import users as api_users


load_dotenv(".env")









# Puedes leer el resto de valores como quieras (desde archivo, variables de entorno, etc.)
db_user = os.getenv("DB_USER")
db_host = os.getenv("DB_HOST")
db_name = os.getenv("DB_NAME")
db_password  = os.getenv("DB_PASSWORD")
db_port = os.getenv("DB_PORT")  


logger.info(f"Conectando a BD con: usuario={db_user}, password={'***' if db_password else 'VACÍO'}, host={db_host}, puerto={db_port}, bd={db_name}")


try:
    DBEngine.initialize_engine(db_user, db_password, db_host, db_port, db_name)
except Exception as e:
    logger.error(f"Error initializing DB engine: {e}")
    sys.exit(1)


# Función para leer la clave secreta del fichero





#cookie_key_manager = CookieKeyManager(get_rotation_time=get_cookie_rotation_time_from_db,get_grace_period = get_old_cookie_token_limit_hour_from_db,ttl=600  # 10 minutes )




#jwt_key_manager = JWTKeyManager(get_rotation_time=get_jwt_rotation_time_from_db, get_grace_period = get_old_cookie_token_limit_hour_from_db,ttl=600)

app = FastAPI()

# 1) Middleware para sesiones (solo para rutas web) con la clave cargada desde shadow

'''

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:80"],  # SOLO tu dominio en producción
    allow_credentials=True,
    allow_methods=["GET", "POST"],  # Solo estos métodos
    allow_headers=[
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "Cookie",  # Permite leer cookies
        "Set-Cookie"
    ],


    max_age=600  # Tiempo que el navegador cachea la configuración CORS
)


@app.middleware("http")
async def set_secure_headers(request, call_next):
    response = await call_next(request)
    #response.headers["X-Frame-Options"] = "DENY"
    #response.headers["Content-Security-Policy"] = "frame-ancestors 'none';"
    return response
'''

# Middleware personalizado con rotación de clave
app.add_middleware(AdvancedSessionMiddleware, key_manager=cookie_key_manager)






# 3) Rutas Web (HTML + sesiones)
#    - web_auth.router: login, logout, formulario, etc.
#    - web_views.router: páginas protegidas (home, dashboard, etc.)
app.include_router(web_auth.router, prefix="/api", tags=["Web Auth"])
app.include_router(web_config.router, prefix="/api", tags=["Web Config"])
app.include_router(web_profile.router, prefix="/api", tags=["Web Profile"])
app.include_router(web_users.router, prefix="/api", tags=["Web Users"])
app.include_router(web_device.router, prefix="/api", tags=["Web Device"])
app.include_router(web_settings.router, prefix="/api", tags=["Web Settings"])
# 4) Rutas API (JSON + JWT)
#    - api_auth.router: /api/token, validación de credenciales, emisión de JWT
#    - api_users.router: /api/users, endpoints protegidos por token
#app.include_router(api_auth.router, prefix="/api", tags=["API"])
#app.include_router(api_users.router, prefix="/api", tags=["API"])
async def run():
    # Cargar datos maestros (usuarios, roles, etc.)
    try:
        await create_user_notification(notification_id=1, date=datetime.now(timezone.utc))
        logger.info("Application started successfully")
    except Exception as e:
        logger.error(f"Error during startup: {e}")

      



'''

async def on_startup_event():
    await on_startup()
    try:
        await create_user_notification(notification_id=1, date=datetime.now(timezone.utc))
        logger.info("Application started successfully")
    except Exception as e:
        logger.error(f"Error during startup: {e}")

logger.info("Application configuration completed")
'''
