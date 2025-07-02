import os
import sys
from datetime import datetime
from logger import logger
from security.crypto import decrypt_password  # assuming descifrar_contrasena is decrypt_password

def get_most_recent_password(shadow_path: str, master_key: str) -> str:
    if not os.path.exists(shadow_path):
        logger.error(f"File not found at {shadow_path}. Aborting.")
        sys.exit(1)

    with open(shadow_path, "r") as f:
        lines = f.readlines()

    if not lines:
        logger.error(f"The file {shadow_path} is empty. Aborting.")
        sys.exit(1)

    data = []
    for line in lines:
        line = line.strip()
        if not line or ":" not in line:
            continue
        encrypted_text, date_str = line.rsplit(":", 1)
        try:
            date = datetime.strptime(date_str, "%Y-%m-%d_%H-%M-%S")
        except ValueError:
            logger.warning(f"Line with invalid date ignored: {line}")
            continue
        data.append((encrypted_text, date))

    if not data:
        logger.error(f"No valid lines with date found in {shadow_path}. Aborting.")
        sys.exit(1)

    # Get the line with the most recent date
    recent_encrypted_text, _ = max(data, key=lambda x: x[1])

    # Decrypt the password
    try:
        logger.debug(f"Encrypted text to decrypt: {recent_encrypted_text[:50]}...")
        logger.debug(f"Master key used: '{master_key[:8]}...' (partially hidden)")
        password = decrypt_password(recent_encrypted_text, master_key)
        if not password:
            logger.error("Decrypted password is empty. Possible wrong key or decryption error.")
            sys.exit(1)
    except Exception as e:
        logger.error(f"Error decrypting password: {e}")
        sys.exit(1)

    logger.info("Password decrypted successfully.")
    return password


def load_master_data(master_data_path: str):
    if not os.path.exists(master_data_path):
        logger.error(f"File not found at {master_data_path}. Aborting.")
        sys.exit(1)

    with open(master_data_path, "r") as f:
        lines = f.read().strip().splitlines()

    data = {}
    for line in lines:
        if "=" in line:
            key, value = line.split("=", 1)
            data[key.strip()] = value.strip()

    text = data.get("text", "")
    port = data.get("port", "")

    # Validate content
    if not text:
        logger.error("The 'text' field is empty. Aborting.")
        sys.exit(1)

    if not port.isdigit():
        logger.error(f"The 'port' field must be numeric. Received value: '{port}'. Aborting.")
        sys.exit(1)

    try:
        os.remove(master_data_path)
    except Exception as e:
        logger.warning(f"Could not delete the master data file: {e}")

    logger.info("Data loaded successfully and file deleted.")
    return text, port
