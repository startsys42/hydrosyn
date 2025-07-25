


from db.db_password import get_special_chars_from_db

def validate_username(username: str, policy: dict) -> bool:
    # Validación de longitud
    if len(username) < policy["min_length"] or len(username) > policy["max_length"]:
        return False

    # Validar cantidad mínima de letras minúsculas
    if len(re.findall(r"[a-z]", username)) < policy["min_lowercase"]:
        return False

    # Validar cantidad mínima de letras mayúsculas
    if len(re.findall(r"[A-Z]", username)) < policy["min_uppercase"]:
        return False

    # Validar cantidad mínima de números
    if len(re.findall(r"[0-9]", username)) < policy["min_numbers"]:
        return False

    # Validar caracteres alfabéticos distintos
    letters = set(c for c in username if c.isalpha())
    if len(letters) < policy["min_distinct_chars"]:
        return False

    # Validar dígitos distintos mínimos
    digits = set(re.findall(r"\d", username))
    if len(digits) < policy["min_distinct_digits"]:
        return False

    # Validar que solo contenga letras y números (alfa-numérico)
    if not re.fullmatch(r"[a-zA-Z0-9]+", username):
        return False

    return True



def validate_password(username: str, password: str, policy: dict) -> bool:

    # Reglas básicas de la política:
    if len(password) < policy["min_length"]:
        return False
    
    # Números
    if len(re.findall(r"\d", password)) < policy["min_numbers"]:
        return False

    # Mayúsculas
    if len(re.findall(r"[A-Z]", password)) < policy["min_uppercase"]:
        return False
    
    # Minúsculas
    if len(re.findall(r"[a-z]", password)) < policy["min_lowercase"]:
        return False
   
   
    # Caracteres especiales
    list_special_chars=await get_special_chars_from_db()
    special_chars_pattern = f"[{re.escape(''.join(list_special_chars))}]"
    pattern = f"^[a-zA-Z0-9{re.escape(allowed_special_chars)}]+$"

    # Validar caracteres permitidos
    if not re.fullmatch(pattern, password):
        return False
    matches = re.findall(special_chars_pattern, password)
    if len(matches) < policy["min_special_chars"]:
        return False

    # Caracteres distintos mínimos
    letters = set(ch for ch in password if ch.isalpha())
    if len(letters) < policy["min_distinct_chars"]:
        return False

    # Dígitos distintos mínimos
    digits = set(re.findall(r"\d", password))
    if len(digits) < policy["min_distinct_digits"]:
        return False

    # Validar si se permite el username en la contraseña
    if not policy["allow_username_in_password"]:
        if username.lower() in password.lower():
            return False
    
    return True
