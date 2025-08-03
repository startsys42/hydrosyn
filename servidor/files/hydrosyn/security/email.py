
import os
import base64
import re
from logger import logger
import smtplib
from email.message import EmailMessage
from email.mime.text import MIMEText
from email_validator import validate_email, EmailNotValidError
from email.mime.multipart import MIMEMultipart




 


async def validate_email_address(email):
    try:
        v = validate_email(email)
        return True
    except EmailNotValidError as e:
        return False




async def create_message( to: list, subject: str, message_text: str, cc: list = None, bcc: list = None):
    # Validaciones básicas
  
    
    

    # Validar destinatarios to
    for addr in to:
        if not await validate_email_address(addr):
            raise ValueError(f"Invalid 'to' email address: {addr}")

    # Validar cc si existe
    if cc:
        for addr in cc:
            if not await validate_email_address(addr):
                raise ValueError(f"Invalid 'cc' email address: {addr}")

    # Validar bcc si existe
    if bcc:
        for addr in bcc:
            if not await validate_email_address(addr):
                raise ValueError(f"Invalid 'bcc' email address: {addr}")

    if not subject.strip():
        raise ValueError("Subject cannot be empty.")

    if not message_text.strip():
        raise ValueError("Message body cannot be empty.")

    msg = MIMEMultipart()
    msg['From'] = os.getenv("EMAIL_SENDER")  # Usar variable ya cargada
    msg['To'] = ", ".join(to)
    if cc:
        msg['Cc'] = ", ".join(cc)
    if bcc:
        msg['Bcc'] = ", ".join(bcc)
    msg['Subject'] = subject
    msg.attach(MIMEText(message_text, "plain", "utf-8"))
    
    return msg 


async def send_email(to, subject: str, message_text: str, cc=None, bcc=None) -> bool:
    sender = os.getenv("EMAIL_SENDER")
    password = os.getenv("EMAIL_PASSWORD")
    
    if not sender or not password:
        raise ValueError("Email credentials not configured")
    # Asegurarse que to, cc y bcc sean listas
    if isinstance(to, str):
        to = [to]
    if cc is None:
        cc = []
    elif isinstance(cc, str):
        cc = [cc]
    if bcc is None:
        bcc = []
    elif isinstance(bcc, str):
        bcc = [bcc]

 
  
    # El envío debe incluir todos los destinatarios reales
    all_recipients = to + cc + bcc

    try:
        # Crear mensaje (con await porque es async)
        msg = await create_message(to, subject, message_text, cc, bcc)
        
        # Enviar via SMTP
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(sender, password)
            server.send_message(msg)
        
        logger.info(f"Email sent to {to}")
        return True
    except Exception as e:
        logger.error(f"Error sending email: {e}")
        return False