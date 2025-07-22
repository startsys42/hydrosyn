from typing import Optional
import os
from logger import logger
from security.email import send_email
from dotenv import load_dotenv

load_dotenv(".env")
EMAIL_SENDER = os.getenv("EMAIL_SENDER")

async def email_login_error(
    email: str, 
    lang: str = "en", 
    ip_address: Optional[str] = None
) -> None:
    """
    Notifica un intento fallido de inicio de sesión.
    Define el asunto y cuerpo según el idioma y luego envía el correo.
    
    Args:
        email: Correo del destinatario.
        lang: Idioma del mensaje ('en' o 'es').
        ip_address: (Opcional) IP desde donde se intentó el acceso.
    """
    # Definir asunto según idioma
    subject = {
        "es": "Intento fallido de inicio de sesión en Hydrosyn",
        "en": "Failed login attempt in Hydrosyn",
    }.get(lang, "Failed login attempt in Hydrosyn")  # Default en inglés

    # Definir cuerpo del mensaje según idioma
    body = {
        "es": f"Se detectó un intento fallido de inicio de sesión en tu cuenta en Hydrosyn.\n\n"
              f"IP de origen: {ip_address if ip_address else 'No registrada'}\n\n"
              "Si no fuiste tú, cambia tu contraseña inmediatamente.",
        "en": f"A failed login attempt was detected for your account in Hydrosyn.\n\n"
              f"Origin IP: {ip_address if ip_address else 'Not recorded'}\n\n"
              "If this wasn't you, please change your password immediately.",
    }.get(lang)

    if not send_email(
        sender=EMAIL_SENDER,
        to=email,
        subject=subject,
        message_text=body
    ):
        raise Exception("Failed to send login attempt notification")


async def email_password_recovery_error(
    email: str, 
    lang: str = "en", 
    ip_address: Optional[str] = None
) -> None:
    """
    Notifica un intento fallido de recuperación de contraseña.
    Define el asunto y cuerpo según el idioma y luego envía el correo.
    
    Args:
        email: Correo del destinatario.
        lang: Idioma del mensaje ('en' o 'es').
        ip_address: (Opcional) IP desde donde se intentó el acceso.
    """
    # Definir asunto según idioma
    subject = {
        "es": "Intento fallido de recuperación de contraseña en Hydrosyn",
        "en": "Failed password recovery attempt in Hydrosyn",
    }.get(lang, "Failed password recovery attempt in Hydrosyn")

    # Definir cuerpo del mensaje según idioma
    body = {
        "es": f"Alguien intentó recuperar la contraseña de tu cuenta en Hydrosyn.\n\n"
              f"IP de origen: {ip_address if ip_address else 'No registrada'}\n\n"
              "Si no fuiste tú, ignora este mensaje.",
        "en": f"Someone tried to recover the password for your account in Hydrosyn.\n\n"
              f"Origin IP: {ip_address if ip_address else 'Not recorded'}\n\n"
              "If this wasn't you, please ignore this email.",
    }.get(lang)

    if not send_email(
        sender=EMAIL_SENDER,
        to=email,
        subject=subject,
        message_text=body
    ):
        raise Exception("Failed to send password recovery notification")