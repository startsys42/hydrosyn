import os
import logging
from logging.handlers import TimedRotatingFileHandler

log_dir = os.getenv("LOG_DIR", "logs")
os.makedirs(log_dir, exist_ok=True)  # crea carpeta si no existe
log_file = log_dir / "hydrosyn.log"
logger = logging.getLogger("hydrosyn_logs")
logger.setLevel(logging.INFO)

# Rotar cada día a la medianoche, mantener 30 archivos (30 días)
if not logger.hasHandlers():
        handler = TimedRotatingFileHandler(
        filename=str(log_file),
        when="midnight",
        interval=1,
        backupCount=30,
        encoding="utf-8"
    )

formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)
