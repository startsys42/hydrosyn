from fastapi import FastAPI
from fastapi import Request
from logger import logger 
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from starlette.middleware.sessions import SessionMiddleware
from security.keys import GestorClaves
from security.middleware import DualSessionMiddleware
from db.config import obtener_tiempo_rotacion_desde_bd
from security.crypto import descifrar_contrasena
import os
import sys
from db.conexion import inicializar_engine
from datetime import datetime
from datetime import time
from jobs.sessions import periodic_cleanup_job
import asyncio
from datetime import datetime, timedelta
from fastapi import FastAPI
from db.config import obtener_hora_limpieza_desde_bd
from db.conexion import get_engine
from sqlalchemy import text
from logger import logger






# Importamos routers
from app.web import auth as web_auth
from app.web import views as web_views
from app.api import auth as api_auth
from app.api import users as api_users
ruta_user_shadow = "/var/lib/hydrosyn/user_db.shadow"
ruta_k_bd = "/var/lib/hydrosyn/session.key"
def cargar_datos_maestros():
    if not os.path.exists(ruta_k_bd):
        logger.error(f"Archivo no encontrado en {ruta_k_bd}. Abortando.")
        sys.exit(1)

    with open(ruta_k_bd, "r") as f:
        lineas = f.read().strip().splitlines()

    datos = {}
    for linea in lineas:
        if "=" in linea:
            clave, valor = linea.split("=", 1)
            datos[clave.strip()] = valor.strip()

    texto = datos.get("texto", "")
    puerto = datos.get("puerto", "")

    # Validar contenido
    if not texto:
        logger.error("El campo 'texto' está vacío. Abortando.")
        sys.exit(1)

    if not puerto.isdigit():
        logger.error(f"El campo 'puerto' debe ser numérico. Valor recibido: '{puerto}'. Abortando.")
        sys.exit(1)

    try:
        os.remove(ruta_k_bd)
    except Exception as e:
        logger.warning(f"No se pudo borrar el fichero de datos: {e}")

    logger.info("Datos cargados correctamente y fichero borrado.")
    return texto, puerto


km, bd_port = cargar_datos_maestros()




# Puedes leer el resto de valores como quieras (desde archivo, variables de entorno, etc.)
usuario = "hydro_user"
password = obtener_password_mas_reciente(ruta_user_shadow, km)
host = "127.0.0.1"
nombre_bd = "hydrosyn_db"
logger.info(f"Conectando a BD con: usuario={usuario}, password={'***' if password else 'VACÍO'}, host={host}, puerto={bd_port}, bd={nombre_bd}")

try:
    inicializar_engine(usuario, password, host, bd_port, nombre_bd)
except Exception as e:
    logger.error(f"Error inicializando motor DB: {e}")
    sys.exit(1)



# Función para leer la clave secreta del fichero



gestor_claves = GestorClaves(
    obtener_tiempo_rotacion=obtener_tiempo_rotacion_desde_bd,
    ttl=600  # 10 minutos
)


app = FastAPI()
@app.on_event("startup")
async def startup_event():
    asyncio.create_task(periodic_cleanup_job())
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

logger.info("La aplicación FastAPI ha arrancado")
