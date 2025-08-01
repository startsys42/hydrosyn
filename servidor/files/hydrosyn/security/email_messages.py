from typing import Optional
import os
from logger import logger
from security.email import send_email
from db.db_auth import get_user_login_from_db, update_2fa_code_in_db, update_password_in_db 
from security.hash import hash_password
from security.random_password import generate_strong_password
import string
import random

async def email_login_error(
    email: str, 
    lang: str = "en", 
    ip_address: Optional[str] = None
) -> None:
   
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

    if not await send_email(
        to=email,
        subject=subject,
        message_text=body
    ):
        raise Exception("Failed to send login attempt notification")


async def generate_2fa_email(user_id:int, email: str, lang: str) -> bool:
    characters = string.ascii_letters + string.digits  # a-zA-Z0-9
    code_2fa= ''.join(random.choices(characters, k=6))
    if not await update_2fa_code_in_db(user_id, code_2fa): 
        return False
    subject = {
        "es": "Código de autenticación de dos factores",
        "en": "Two-Factor Authentication Code",
    }.get(lang, "Two-Factor Authentication Code")

    body = {
        "es": f"Por favor, utiliza el siguiente código para completar tu autenticación de dos factores {code_2fa}.",
        "en": f"Please use the following code to complete your two-factor authentication: {code_2fa}.",
    }.get(lang)

    if not send_email(
        to=email,
        subject=subject,
        message_text=body
    ):
        raise Exception("Failed to send 2FA email")
    return True


async def generate_2fa_new_email(user_id:int, email: str, lang: str) -> str:
    characters = string.ascii_letters + string.digits  # a-zA-Z0-9
    code_2fa= ''.join(random.choices(characters, k=6))
    
    subject = {
        "es": "Código de autenticación de dos factores",
        "en": "Two-Factor Authentication Code",
    }.get(lang, "Two-Factor Authentication Code")

    body = {
        "es": f"Por favor, utiliza el siguiente código para completar tu cambio de email {code_2fa}.",
        "en": f"Please use the following code to complete your email change: {code_2fa}.",
    }.get(lang)

    if not send_email(
        to=email,
        subject=subject,
        message_text=body
    ):
        raise Exception("Failed to send code change new email")
    return code_2fa



async def email_recovery_error(
    email: str, 
    lang: str = "en", 
    ip_address: Optional[str] = None
) -> None:
   
    # Definir asunto según idioma
    subject = {
        "es": "Intento fallido de recuperación de contraseña en Hydrosyn",
        "en": "Failed password recovery attempt in Hydrosyn",
    }.get(lang, "Failed password recovery attempt in Hydrosyn")

    # Definir cuerpo del mensaje según idioma
    body = {
        "es": f"Se detectó un intento fallido de recuperación de contraseña en tu cuenta en Hydrosyn.\n\n"
              f"IP de origen: {ip_address if ip_address else 'No registrada'}\n\n"
              "Si no fuiste tú, cambia tu contraseña inmediatamente.",
        "en": f"A failed password recovery attempt was detected for your account in Hydrosyn.\n\n"
              f"Origin IP: {ip_address if ip_address else 'Not recorded'}\n\n"
              "If this wasn't you, please change your password immediately.",
    }.get(lang)

    if not await send_email(
        to=email,
        subject=subject,
        message_text=body
    ):
        raise Exception("Failed to send login attempt notification")

async def generate_new_password_email(user_id: int, email: str, username: str, lang: str) -> bool:
    new_password = generate_strong_password(username)
    hash = hash_password(new_password)
    if not await update_password_in_db(user_id, hash):
        return False
    subject = {
        "es": "Nueva contraseña de Hydrosyn",
        "en": "New Password for Hydrosyn",
    }.get(lang, "New Password for Hydrosyn")

    body = {
        "es": f"Has solicitado una nueva contraseña. Si no has sido tú, debes cambiar tu nombre de usuario, correo electrónico o ambos. Tu nueva contraseña es: {new_password}",
        "en": f"You have requested a new password. If this wasn't you, you should change your username, email, or both. Your new password is: {new_password}",
    }.get(lang)

    if not send_email(
        to=email,
        subject=subject,
        message_text=body
    ):
        raise Exception("Failed to send new password email")
    return True
