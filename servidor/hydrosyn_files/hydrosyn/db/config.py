from sqlalchemy import create_engine, text

# Cambia estos valores por los de tu entorno
usuario = "mi_usuario"
password = "mi_contraseña"
host = "localhost"
puerto = 3306
nombre_bd = "mi_base_de_datos"

# Conexión a MariaDB usando pymysql
engine = create_engine(
    f"mysql+pymysql://{usuario}:{password}@{host}:{puerto}/{nombre_bd}",
    pool_pre_ping=True
)

def obtener_tiempo_rotacion_desde_bd() -> int:
    with engine.connect() as conn:
        result = conn.execute(
            text("SELECT valor FROM configuracion WHERE clave = 'tiempo_rotacion_sesiones'")
        ).fetchone()
        if result:
            return int(result[0])
        return 3600  # Valor por defecto si no existe en BD
