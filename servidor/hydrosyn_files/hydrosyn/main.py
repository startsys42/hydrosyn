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

import asyncio
from datetime import datetime, timedelta
from fastapi import FastAPI
from db.config import obtener_hora_limpieza_desde_bd
from db.conexion import get_engine
from sqlalchemy import text
from logger import logger

async def limpiar_sesiones_expiradas():
    ahora = datetime.utcnow()
    try:
        with get_engine().connect() as conn:
            result = conn.execute(
                text("DELETE FROM sessions WHERE expires_at < :ahora"),
                {"ahora": ahora}
            )
            logger.info(f"Sesiones expiradas eliminadas: {result.rowcount}")
    except Exception as e:
        logger.error(f"Error al limpiar sesiones expiradas: {e}")
async def job_limpieza_periodica():
    while True:
        hora_limpieza_int = int(obtener_hora_limpieza_desde_bd())  # Ej: 2 para las 2AM
        hora_limpieza = time(hour=hora_limpieza_int, minute=0, second=0)

        ahora_dt = datetime.utcnow()
        proxima_ejecucion_dt = ahora_dt.replace(hour=hora_limpieza.hour, minute=hora_limpieza.minute, second=hora_limpieza.second, microsecond=0)

        if ahora_dt >= proxima_ejecucion_dt:
            proxima_ejecucion_dt += timedelta(days=1)

        segundos_espera = (proxima_ejecucion_dt - ahora_dt).total_seconds()
        logger.info(f"Esperando {segundos_espera} segundos para la próxima limpieza de sesiones...")

        await asyncio.sleep(segundos_espera)

        await limpiar_sesiones_expiradas()


def obtener_password_mas_reciente(ruta_shadow: str, clave_maestra: str) -> str:
    if not os.path.exists(ruta_shadow):
        logger.error(f"Archivo no encontrado en {ruta_shadow}. Abortando.")
        sys.exit(1)

    with open(ruta_shadow, "r") as f:
        lineas = f.readlines()

    if not lineas:
        logger.error(f"El fichero {ruta_shadow} está vacío. Abortando.")
        sys.exit(1)

    datos = []
    for linea in lineas:
        linea = linea.strip()
        if not linea or ":" not in linea:
            continue
        texto_cifrado, fecha_str = linea.rsplit(":", 1)
        try:
            fecha = datetime.strptime(fecha_str, "%Y-%m-%d_%H-%M-%S")

        except ValueError:
            logger.warning(f"Línea con fecha no válida ignorada: {linea}")
            continue
        datos.append((texto_cifrado, fecha))

    if not datos:
        logger.error(f"No hay líneas válidas con fecha en {ruta_shadow}. Abortando.")
        sys.exit(1)

    # Línea con fecha más reciente
    texto_cifrado_reciente, _ = max(datos, key=lambda x: x[1])

    # Descifrar la contraseña
    try:
        password = descifrar_contrasena(texto_cifrado_reciente, clave_maestra)
    except Exception as e:
        logger.error(f"Error al descifrar la contraseña: {e}")
        sys.exit(1)

    logger.info("Contraseña descifrada correctamente.")
    return password

# Importamos routers
from app.web import auth as web_auth
from app.web import views as web_views
from app.api import auth as api_auth
from app.api import users as api_users
ruta_user_shadow = "/etc/hydrosyn/user_db.shadow"
ruta_k_bd = "/etc/hydrosyn/session.key"
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
host = "localhost"
nombre_bd = "hydrosyn_db"

inicializar_engine(usuario, password, host, bd_port, nombre_bd)



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
@app.on_event("startup")
async def startup_event():
    asyncio.create_task(job_limpieza_periodica())
# 1) Middleware para sesiones (solo para rutas web) con la clave cargada desde shadow
#app.add_middleware(SessionMiddleware, secret_key=secret_key)





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
