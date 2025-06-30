import os
import sys
from datetime import datetime
from logger import logger
from security.crypto import decrypt_password 

def get_most_recent_password(ruta_shadow: str, clave_maestra: str) -> str:
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
        logger.debug(f"Texto cifrado a descifrar: {texto_cifrado_reciente[:50]}...")
        logger.debug(f"Clave maestra usada: '{clave_maestra[:8]}...' (ocultada parcialmente)")
        password = descifrar_contrasena(texto_cifrado_reciente, clave_maestra)
        if not password:
            logger.error("La contraseña descifrada está vacía. Posible clave incorrecta o error de descifrado.")
            sys.exit(1)
    except Exception as e:
        logger.error(f"Error al descifrar la contraseña: {e}")
        sys.exit(1)

    logger.info("Contraseña descifrada correctamente.")
    return password


def cargar_datos_maestros(ruta_k_bd: str):
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
