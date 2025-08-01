from email_validator import validate_email, EmailNotValidError



async def is_valid_email(email_str: str) -> bool:
    """
    Verifica si un string es un email válido.
    
    Args:
        email_str (str): String a validar
        
    Returns:
        bool: True si es email válido, False si no lo es
    """
    try:
        # Validar el email (check_deliverability=False para mayor velocidad)
        validate_email(email_str, check_deliverability=False)
        return True
    except EmailNotValidError:
        return False