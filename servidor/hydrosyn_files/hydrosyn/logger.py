import logging
from logging.handlers import RotatingFileHandler

# Configurar logger con rotación para evitar que el archivo crezca sin límite
logger = logging.getLogger("hydrosyn_logs")
logger.setLevel(logging.INFO)

handler = RotatingFileHandler("logs/hydrosyn.log", maxBytes=5*1024*1024, backupCount=7)  # 5MB por archivo, 3 backups
formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)

logger.addHandler(handler)

# Uso del logger
#logger.info("Aplicación iniciada")
#logger.error("Ocurrió un error grave")
