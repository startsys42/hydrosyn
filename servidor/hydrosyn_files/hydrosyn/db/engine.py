from sqlalchemy import create_engine
from security.secrets import obtener_password_mas_reciente, cargar_datos_maestros
from logger import logger

_engine = None

def initialize_engine(user, password, host, port, db_name):
    global _engine
    logger.info(f"Connecting to DB with: user={user}, password={'***' if password else 'EMPTY'}, host={host}, port={port}, db={db_name}")

    if not user or not password or not host or not port or not db_name:
        raise ValueError("All connection parameters must have a valid value.")

    if not _engine:
        try:
            _engine = create_engine(
                f"mysql+pymysql://{user}:{password}@{host}:{port}/{db_name}",
                pool_pre_ping=True
            )
            logger.info("Database engine initialized successfully.")
        except Exception as e:
            logger.error(f"Error initializing DB engine: {e}")
            raise

def get_engine():
    if not _engine:
        raise RuntimeError("Engine not initialized. Call 'initialize_engine' first.")
    return _engine
