import time
import secrets
from itsdangerous import URLSafeSerializer, BadSignature


SECRET_KEY = secrets.token_urlsafe(32)


csrf_serializer = URLSafeSerializer(SECRET_KEY, salt="csrf-protection")

def generate_csrf_token():
    """Genera un token CSRF con contenido aleatorio y timestamp."""
    data = {
        "csrf": secrets.token_urlsafe(16),
        "ts": int(time.time())
    }
    return csrf_serializer.dumps(data)

def validate_csrf_token(token, max_age=3600):

    try:
        csrf_serializer.loads(token, max_age=max_age)
        return True
    except BadSignature:
        return False
    except Exception:
        return False
