from fastapi import APIRouter, HTTPException, Depends, status, Request, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
import secrets

# Configuración JWT
SECRET_KEY = "una_clave_super_segura_cambia_esto"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_EXPIRE_DAYS = 7
PASSWORD_RESET_TOKEN_EXPIRE_HOURS = 1

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
router = APIRouter()

# Simula base de datos (usa la tuya)
fake_users_db = {
    "user1": {
        "username": "user1",
        "email": "user1@example.com",
        "hashed_password": pwd_context.hash("secret123"),
        "is_active": True,
        "password_last_changed": datetime.utcnow(),
        "token_invalid_before": datetime.utcnow()
    }
}

# Modelos Pydantic
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class TokenRefreshRequest(BaseModel):
    refresh_token: str

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetConfirmRequest(BaseModel):
    token: str
    new_password: str

# Funciones auxiliares
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    now = datetime.utcnow()
    to_encode.update({"iat": now})
    expire = now + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def create_refresh_token(data: dict):
    now = datetime.utcnow()
    expire = now + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode = data.copy()
    to_encode.update({"iat": now, "exp": expire, "scope": "refresh_token"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido o expirado")

def get_user(username: str):
    user = fake_users_db.get(username)
    if user and user["is_active"]:
        return user
    return None

# --- LOGIN y TOKENS ---

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = get_user(form_data.username)
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales inválidas")
    
    # Chequear invalidación por cambio de contraseña
    # (en token validation se hace, aquí solo login)
    
    access_token = create_access_token(data={"sub": user["username"]})
    refresh_token = create_refresh_token(data={"sub": user["username"]})
    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}

# --- RENOVAR ACCESS TOKEN ---

@router.post("/token/refresh", response_model=Token)
async def refresh_token(req: TokenRefreshRequest):
    payload = decode_token(req.refresh_token)
    if payload.get("scope") != "refresh_token":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token no válido para refresh")

    username = payload.get("sub")
    if not username:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")
    
    user = get_user(username)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario no existe")

    # Validar que token fue emitido después del token_invalid_before
    token_iat = datetime.utcfromtimestamp(payload["iat"])
    if token_iat < user["token_invalid_before"]:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token inválido por cambio de contraseña")

    new_access_token = create_access_token(data={"sub": username})
    new_refresh_token = create_refresh_token(data={"sub": username})
    return {"access_token": new_access_token, "refresh_token": new_refresh_token, "token_type": "bearer"}

# --- RECUPERAR CONTRASEÑA ---

# Simulación: enviar mail async (aquí solo imprime)
async def send_password_reset_email(email: str, token: str):
    print(f"Enviando email a {email} con token {token}")

@router.post("/password-reset/request")
async def password_reset_request(req: PasswordResetRequest, background_tasks: BackgroundTasks):
    # Busca usuario por email
    user = next((u for u in fake_users_db.values() if u["email"] == req.email), None)
    if not user:
        # No revelar que no existe
        return {"message": "Si el email existe, se enviará un enlace para restablecer la contraseña."}

    # Crear token de recuperación (con expiración)
    now = datetime.utcnow()
    expire = now + timedelta(hours=PASSWORD_RESET_TOKEN_EXPIRE_HOURS)
    reset_token = jwt.encode({"sub": user["username"], "exp": expire, "iat": now, "scope": "password_reset"}, SECRET_KEY, algorithm=ALGORITHM)

    background_tasks.add_task(send_password_reset_email, req.email, reset_token)

    return {"message": "Si el email existe, se enviará un enlace para restablecer la contraseña."}

@router.post("/password-reset/confirm")
async def password_reset_confirm(req: PasswordResetConfirmRequest):
    try:
        payload = jwt.decode(req.token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("scope") != "password_reset":
            raise HTTPException(status_code=400, detail="Token inválido para recuperación de contraseña")
    except JWTError:
        raise HTTPException(status_code=400, detail="Token inválido o expirado")

    username = payload.get("sub")
    if not username or username not in fake_users_db:
        raise HTTPException(status_code=400, detail="Usuario no válido")

    user = fake_users_db[username]
    # Actualiza contraseña y fecha de cambio y token invalidation
    user["hashed_password"] = get_password_hash(req.new_password)
    user["password_last_changed"] = datetime.utcnow()
    user["token_invalid_before"] = datetime.utcnow()  # Invalida tokens anteriores
    
    return {"message": "Contraseña actualizada correctamente."}
