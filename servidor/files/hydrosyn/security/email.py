
import os
import base64
import re
from logger import logger
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from email.mime.text import MIMEText
from email_validator import validate_email, EmailNotValidErro

SCOPES = ['https://www.googleapis.com/auth/gmail.send']
CLIENT_SECRET_FILE = os.getenv("GMAIL_CLIENT_SECRET_FILE", "../secrets/gmail_credentials.json")
TOKEN_FILE = os.getenv("GMAIL_TOKEN_FILE", "../secrets/gmail_token.json")

def validate_email_address(email):
    try:
        v = validate_email(email)
        return True
    except EmailNotValidError as e:
        return False

def get_gmail_service():
    creds = None
    if os.path.exists(TOKEN_FILE):
        creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)
    if not creds or not creds.valid:
        flow = InstalledAppFlow.from_client_secrets_file(CLIENT_SECRET_FILE, SCOPES)
        creds = flow.run_local_server(port=0)
        with open(TOKEN_FILE, 'w') as token:
            token.write(creds.to_json())
    return build('gmail', 'v1', credentials=creds)


def create_message(sender: str, to: list, subject: str, message_text: str, cc: list = None, bcc: list = None):
    # Validaciones básicas
    if not sender or not to:
        raise ValueError("Sender and recipient(s) cannot be empty.")
    
    # Validar sender
    if not validate_email_address(sender):
        raise ValueError(f"Invalid sender email address: {sender}")

    # Validar destinatarios to
    for addr in to:
        if not validate_email_address(addr):
            raise ValueError(f"Invalid 'to' email address: {addr}")

    # Validar cc si existe
    if cc:
        for addr in cc:
            if not validate_email_address(addr):
                raise ValueError(f"Invalid 'cc' email address: {addr}")

    # Validar bcc si existe
    if bcc:
        for addr in bcc:
            if not validate_email_address(addr):
                raise ValueError(f"Invalid 'bcc' email address: {addr}")

    if not subject.strip():
        raise ValueError("Subject cannot be empty.")

    if not message_text.strip():
        raise ValueError("Message body cannot be empty.")

    msg = MIMEMultipart()
    msg['From'] = sender
    msg['To'] = ", ".join(to)
    if cc:
        msg['Cc'] = ", ".join(cc)
    if bcc:
        msg['Bcc'] = ", ".join(bcc)
    msg['Subject'] = subject

    msg.attach(MIMEText(message_text, "plain", "utf-8"))

    raw = base64.urlsafe_b64encode(msg.as_bytes())
    return {'raw': raw.decode()}


def send_email(sender: str, to, subject: str, message_text: str, cc=None, bcc=None) -> bool:
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

    service = get_gmail_service()
    message = create_message(sender, to, subject, message_text, cc, bcc)
    # El envío debe incluir todos los destinatarios reales
    all_recipients = to + cc + bcc

    try:
        sent = service.users().messages().send(
            userId="me",
            body=message,
            # Agregamos el parámetro para especificar destinatarios reales
            # (a veces la API no lo necesita explícito, pero es mejor)
        ).execute()
        logger.info(f"Email sent. Message Id: {sent['id']}, To: {all_recipients}, Subject: {subject}")
        return True
    except Exception as e:
        logger.error(f"Error sending email to {all_recipients} with subject '{subject}': {e}")
        return False