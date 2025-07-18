from collections import OrderedDict
from cryptography.fernet import Fernet
import secrets
import time
import json
from asyncio import Lock

# Configuración
MAX_STORED_TOKENS = 1000
TOKEN_EXPIRATION = 300  # 5 minutos

# Cifrado
ENCRYPTION_KEY = Fernet.generate_key()
cipher_suite = Fernet(ENCRYPTION_KEY)

csrf_tokens_lock = Lock()
csrf_tokens = OrderedDict()  # {token_id: encrypted_data}

async def generate_csrf_token() -> str:
    """Genera un token CSRF cifrado (similar a two_step_token)."""
    while True:
        token_id = secrets.token_urlsafe(32)
        async with csrf_tokens_lock:
            if token_id not in csrf_tokens:
                break
    
    token_data = {
        "token_id": token_id,
        "ts": int(time.time())  # Timestamp de creación
    }
    encrypted_data = cipher_suite.encrypt(json.dumps(token_data).encode())

    # Almacenar en memoria (eliminando el más antiguo si hay overflow)
    async with csrf_tokens_lock:
        csrf_tokens[token_id] = encrypted_data
        if len(csrf_tokens) > MAX_STORED_TOKENS:
            csrf_tokens.popitem(last=False)
    
    # Devolver el token_id CIFRADO (para que el cliente lo guarde)
    return cipher_suite.encrypt(token_id.encode()).decode()

async def validate_and_remove_csrf_token(encrypted_token: str) -> bool:
    """Valida el token CSRF y lo elimina si es válido (todo en uno)."""
    try:
        # 1. Descifrar token_id del cliente
        token_id = cipher_suite.decrypt(encrypted_token.encode()).decode()
        
        # 2. Obtener y eliminar el token (operación atómica)
        async with csrf_tokens_lock:
            encrypted_data = csrf_tokens.pop(token_id, None)  # Elimina al obtener
            if not encrypted_data:
                return False
        
        # 3. Descifrar y verificar expiración
        token_data = json.loads(cipher_suite.decrypt(encrypted_data).decode())
        if (time.time() - token_data["ts"]) > TOKEN_EXPIRATION:
            return False
        
        return True  # Token válido y eliminado
    
    except Exception:
        return False 