from sqlalchemy import create_engine

_engine = None  # Se inicializa más tarde


def inicializar_engine(usuario, password, host, puerto, nombre_bd):
    global _engine
    if not _engine:
        _engine = create_engine(
            f"mysql+pymysql://{usuario}:{password}@{host}:{puerto}/{nombre_bd}",
            pool_pre_ping=True
        )


def get_engine():
    if not _engine:
        raise RuntimeError("Engine no inicializado")
    return _engine
