from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.security import HTTPBearer
import secrets
import time
from itsdangerous import URLSafeSerializer


SECRET_KEY = secrets.token_urlsafe(32)
serializer = URLSafeSerializer(SECRET_KEY, salt="two_steps")

pending = {}  # {user_id: {token: str, expires: int}}

security = HTTPBearer()

def create_2fa_token(user_id: str) -> str:
    """Crea token vinculado al usuario con expiración"""
    token = serializer.dumps({
        "sub": user_id,
        "exp": int(time.time()) + 300  # 5 minutos de validez
    })
    
    pending_2fa[user_id] = {
        "token": token,
        "expires": int(time.time()) + 300
    }
    
    return token

def verify_2fa_token(user_id: str, token: str) -> bool:
    """Verifica que el token coincida con el usuario"""
    if user_id not in pending_2fa:
        return False
        
    stored_data = pending_2fa[user_id]
    
    try:
        # Verifica firma y expiración
        data = serializer.loads(token, max_age=300)
        # Verifica coincidencia usuario y token
        return (data["sub"] == user_id and 
                token == stored_data["token"] and
                time.time() < stored_data["expires"])
    except:
        return False
