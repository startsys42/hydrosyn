async def email_login_error(email: str, lang: str = "en", ip_address: str = None):
    template_file = f"login_error_{lang}.html"
    subject = {
        "en": "Failed Login Attempt",
        "es": "Intento de Inicio de Sesión Fallido"
    }.get(lang, "Failed Login Attempt")

    body = render_template(template_file, email)
    if not send_email(email, subject, body):
        raise Exception("Failed to send login error email")

async def email_password_recovery_error(email: str, lang: str = "en", ip_address: str = None):
    template_file = f"password_recovery_error_{lang}.html"
    subject = {
        "en": "Failed Password Recovery Attempt",
        "es": "Intento Fallido de Recuperación de Contraseña"
    }.get(lang, "Failed Password Recovery Attempt")

    body = render_template(template_file, email)
    if not send_email(email, subject, body):
        raise Exception("Failed to send password recovery error email")