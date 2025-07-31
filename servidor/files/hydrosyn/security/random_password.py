from random import random
import string
from security.password__name_validity import validate_password

def generate_strong_password(username: str) -> str:
    # Caracteres permitidos
    lowercase = string.ascii_lowercase
    uppercase = string.ascii_uppercase
    digits = string.digits
    special_chars = "!@#$%?="
    
    while True:  # Bucle infinito hasta generar una contraseña válida
        # 1. Garantizamos al menos 1 de cada tipo
        password = [
            random.choice(uppercase),  # 1 mayúscula
            random.choice(lowercase),  # 1 minúscula
            random.choice(digits),     # 1 número
            random.choice(special_chars),  # 1 símbolo
        ]
        
        # 2. Completamos hasta 10+ caracteres con mezcla aleatoria
        remaining_length = random.randint(6, 12)  # Entre 10 y 16 caracteres
        all_chars = lowercase + uppercase + digits + special_chars
        password.extend(random.choices(all_chars, k=remaining_length))
        
        # 3. Mezclamos para evitar patrones predecibles
        random.shuffle(password)
        password = "".join(password)
        
        # 4. Verificamos si cumple todas las reglas
        if validate_password(username, password=password):
            return password