from collections import OrderedDict  # Necesario para OrderedDict
from urllib.parse import quote_plus  # Necesario para quote_plus
import json  # Necesario para json.dumps

from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.security import HTTPBearer
import secrets
import time
from itsdangerous import URLSafeSerializer
from asyncio import Lock
from cryptography.fernet import Fernet  # E

MAX_STORED_TOKENS = 1000

TOKEN_EXPIRATION = 480  # 8 minutes

# Cifrado
ENCRYPTION_KEY = Fernet.generate_key()
cipher_suite = Fernet(ENCRYPTION_KEY)

tokens_lock = Lock()
two_step_tokens = OrderedDict()  # Tokens válidos pendientes de uso

async def generate_two_step_token(user_id: int, session_id: int,twofa: bool):

    while True:
        token_value = secrets.token_urlsafe(32)
        async with tokens_lock:
            if token_value not in two_step_tokens:
                break
    
    token_data = {
        "token_id": token_value,
        "user_id": user_id,
        "session_id": session_id,
        "twofa": twofa, 
        "ts":  int(time.time())
    }
    encrypted_data = cipher_suite.encrypt(json.dumps(token_data).encode())

    # Guardar en memoria (con candado para evitar errores)
    async with tokens_lock:
        two_step_tokens[token_value] = encrypted_data
        if len(two_step_tokens) > MAX_STORED_TOKENS:
            two_step_tokens.popitem(last=False)  # Elimina el más viejo
    
    # Devolvemos el token_value CIFRADO al cliente
    return cipher_suite.encrypt(token_value.encode()).decode()

async def validate_two_step_token(encrypted_token: str):
    """SOLO VALIDA (sin eliminar)"""
    try:
        # 1. Descifrar token del cliente
        token_value = cipher_suite.decrypt(encrypted_token.encode()).decode()
        
        # 2. Obtener datos SIN ELIMINAR
        async with tokens_lock:
            encrypted_data = two_step_tokens.get(token_value, None)
            if not encrypted_data:
                return None
        
        # 3. Descifrar datos
        token_data = json.loads(cipher_suite.decrypt(encrypted_data).decode())
        
        # 4. Verificar tiempo
        if (time.time() - token_data["ts"]) > TOKEN_EXPIRATION:
            remove_two_step_token(encrypted_token)  # Eliminar si ha expirado
            return None
        
        return token_data
    
    except Exception:
        return None

async def remove_two_step_token(encrypted_token: str):
    """ELIMINA el token después de su uso"""
    try:
        token_value = cipher_suite.decrypt(encrypted_token.encode()).decode()
        async with tokens_lock:
            two_step_tokens.pop(token_value, None)
        return True
    except Exception:
        return False