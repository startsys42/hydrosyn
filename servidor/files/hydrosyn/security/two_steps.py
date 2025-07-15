from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.security import HTTPBearer
import secrets
import time
from itsdangerous import URLSafeSerializer


SECRET_KEY_TWO_STEP = secrets.token_urlsafe(32)
serializer_two_step = URLSafeSerializer(SECRET_KEY_TWO_STEP, salt="two_steps")



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

def validate_two_step_token(token, max_age=300):
  
    try:
        
        data = serializer_two_step.loads(token)
        
    
        if data["token_id"] not in two_step_tokens:
            return False
            
        
        current_time = time.time()
        if (current_time - data["ts"]) > max_age:
            
            two_step_tokens.pop(data["token_id"], None)
            return False
            
      
        two_step_tokens.pop(data["token_id"], None)
        return True
        
    except BadSignature:
        return False
    except Exception:
        return False
