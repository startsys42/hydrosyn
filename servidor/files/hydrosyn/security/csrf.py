import time
import secrets
from itsdangerous import URLSafeSerializer, BadSignature
from collections import OrderedDict
import threading

lock = threading.Lock()

# Configuración de seguridad
SECRET_KEY_CSRF = secrets.token_urlsafe(32)
csrf_serializer = URLSafeSerializer(SECRET_KEY_CSRF, salt="csrf-protection")
MAX_STORED_TOKENS = 1000


generated_tokens = OrderedDict()  # Tokens válidos pendientes de uso

def generate_csrf_token():
    """Genera y registra un nuevo token CSRF"""
    while True:
        token_value = secrets.token_urlsafe(16)  # Valor único
        with lock:
            if token_value in generated_tokens:
                continue
            # Ya está seguro que el token no existe
            break
    
   
    token_data = {
        "csrf": token_value,
        "ts": int(time.time())
    }
    
   
    token = csrf_serializer.dumps(token_data)
    
 
    with lock:
        generated_tokens[token_value] = token_data["ts"]
        if len(generated_tokens) > MAX_STORED_TOKENS:
            generated_tokens.popitem(last=False)
    
    return token

def validate_csrf_token(token, max_age=3600):
    try:
        data = csrf_serializer.loads(token)
        token_value = data.get("csrf")
        timestamp = data.get("ts")

        with lock:
            if not token_value or token_value not in generated_tokens:
                return False

            if (time.time() - timestamp) > max_age:
                generated_tokens.pop(token_value, None)
                return False

            generated_tokens.pop(token_value, None)
            return True

    except (BadSignature, KeyError, TypeError):
        return False