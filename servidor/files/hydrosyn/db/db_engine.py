from sqlalchemy import create_engine
from logger import logger

class DBEngine:
    _engine = None

    @classmethod
    def initialize_engine(cls, user, password, host, port, db_name):
      #  logger.info(f"Connecting to DB with: user={user}, password={'***' if password else 'EMPTY'}, host={host}, port={port}, db={db_name}")

        if not user or not password or not host or not port or not db_name:
            raise ValueError("All connection parameters must have a valid value.")

        if cls._engine is None:
            try:
                cls._engine = create_engine(
                    f"mysql+pymysql://{user}:{password}@{host}:{port}/{db_name}",
                    pool_pre_ping=True
                )
                logger.info("Database engine initialized successfully.")
            except Exception as e:
                logger.error(f"Error initializing DB engine: {e}")
                raise

    @classmethod
    def get_engine(cls):
        if cls._engine is None:
            raise RuntimeError("Engine not initialized. Call 'initialize_engine' first.")
        return cls._engine
