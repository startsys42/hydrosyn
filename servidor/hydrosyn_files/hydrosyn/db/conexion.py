from sqlalchemy import create_engine
from security.secrets import obtener_password_mas_reciente, cargar_datos_maestros
from logger import logger

_engine = None

def inicializar_engine(usuario, password, host, puerto, nombre_bd):
   
    global _engine
    logger.info(f"Conectando a BD con: usuario={usuario}, password={'***' if password else 'VACÍO'}, host={host}, puerto={puerto}, bd={nombre_bd}")

    if not usuario or not password or not host or not puerto or not nombre_bd:
        raise ValueError("Todos los parámetros de conexión deben tener valor válido.")

    if not _engine:
        try:
            _engine = create_engine(
                f"mysql+pymysql://{usuario}:{password}@{host}:{puerto}/{nombre_bd}",
                pool_pre_ping=True
            )
            logger.info("Motor de base de datos inicializado correctamente.")
        except Exception as e:
            logger.error(f"Error al inicializar motor DB: {e}")
            raise

def get_engine():
    if not _engine:
        raise RuntimeError("Engine no inicializado. Llamar primero a 'inicializar_engine'.")
    return _engine
