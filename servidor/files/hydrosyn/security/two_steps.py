from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.security import HTTPBearer
import secrets
import time
from itsdangerous import URLSafeSerializer


SECRET_KEY_TWO_STEP = secrets.token_urlsafe(32)
serializer_two_step = URLSafeSerializer(SECRET_KEY, salt="two_steps")



two_step_tokens = OrderedDict()  # Tokens válidos pendientes de uso

def generate_two_step_token(user_id: int, session_id: int):

    while True:
        token_value = secrets.token_urlsafe(16)  # Valor único
        if token_value  in two_step_tokens:
            continue
    
   
    token_data = {
        "token_id": token_value,
        "user_id": user_id,
        "session_id": session_id,
        "ts": int(time.time())
    }
    
   
    token = serializer_two_step.dumps(token_data)
    
 
    two_step_tokens[token_value] = token_data["ts"]
    
    
    if len(two_step_tokens) > MAX_STORED_TOKENS:
        two_step_tokens.popitem(last=False)
    
    return token

def verify_two_step_token(user_id: str, token: str) -> bool:
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
