from fastapi import FastAPI
from fastapi import Request
from logger import logger 
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from starlette.middleware.sessions import SessionMiddleware
from security.keys import GestorClaves
from security.middleware import DualSessionMiddleware
from db.db_config import obtener_tiempo_rotacion_desde_bd
from security.crypto import descifrar_contrasena
from security.secrets import obtener_password_mas_reciente, cargar_datos_maestros
import os
import sys
from security.keys import KeyManager
from db.config import get_rotation_time_from_db
from db.conexion import inicializar_engine
from datetime import datetime
from datetime import time
from tasks.sessions import periodic_cleanup_job
import asyncio
from datetime import datetime, timedelta
from fastapi import FastAPI
from db.config import obtener_hora_limpieza_desde_bd
from db.conexion import get_engine
from sqlalchemy import text
from logger import logger
from db_engine import DBEngine 





# Importamos routers
from app.web import auth as web_auth
from app.web import views as web_views
from app.api import auth as api_auth
from app.api import users as api_users
user_shadow_path = "/var/lib/hydrosyn/user_db.shadow"
k_db_path = "/var/lib/hydrosyn/session.key"



km, db_port = load_master_data(k_db_path)




# Puedes leer el resto de valores como quieras (desde archivo, variables de entorno, etc.)
db_user = "hydro_user"
password  = get_most_recent_password(user_shadow_path, km)
db_host = "127.0.0.1"
db_name = "hydrosyn_db"
logger.info(f"Conectando a BD con: usuario={db_user}, password={'***' if password else 'VACÍO'}, host={db_host}, puerto={db_port}, bd={db_name}")


try:
    DBEngine.initialize_engine(db_user, password, db_host, db_port, db_name)
except Exception as e:
    logger.error(f"Error initializing DB engine: {e}")
    sys.exit(1)


# Función para leer la clave secreta del fichero





key_manager = KeyManager(
    get_rotation_time=get_rotation_time_from_db,
    ttl=600  # 10 minutes 
)


app = FastAPI()
@app.on_event("startup")
async def startup_event():
    await on_startup()
# 1) Middleware para sesiones (solo para rutas web) con la clave cargada desde shadow






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

logger.info("Starting application...")
