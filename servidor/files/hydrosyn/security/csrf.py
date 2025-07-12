import time
import secrets
from itsdangerous import URLSafeSerializer, BadSignature
import time
import secrets
from itsdangerous import URLSafeSerializer, BadSignature
from collections import OrderedDict

# Configuración de seguridad
SECRET_KEY = secrets.token_urlsafe(32)
csrf_serializer = URLSafeSerializer(SECRET_KEY, salt="csrf-protection")


generated_tokens = OrderedDict()  # Tokens válidos pendientes de uso

def generate_csrf_token():
    """Genera y registra un nuevo token CSRF"""
    while True:
        token_value = secrets.token_urlsafe(16)  # Valor único
        if token_value  in generated_tokens:
            continue
    
   
    token_data = {
        "csrf": token_value,
        "ts": int(time.time())
    }
    
   
    token = csrf_serializer.dumps(token_data)
    
 
    generated_tokens[token_value] = token_data["ts"]
    
    
    if len(generated_tokens) > MAX_STORED_TOKENS:
        generated_tokens.popitem(last=False)
    
    return token

def validate_csrf_token(token, max_age=3600):
  
    try:
        
        data = csrf_serializer.loads(token)
        
    
        if data["csrf"] not in generated_tokens:
            return False
            
        
        current_time = time.time()
        if (current_time - data["ts"]) > max_age:
            
            generated_tokens.pop(data["csrf"], None)
            return False
            
      
        generated_tokens.pop(data["csrf"], None)
        return True
        
    except BadSignature:
        return False
    except Exception:
        return False


