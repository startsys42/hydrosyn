
import os
import base64
import re
from logger import logger
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from email.mime.text import MIMEText

SCOPES = ['https://www.googleapis.com/auth/gmail.send']
CLIENT_SECRET_FILE = os.getenv("GMAIL_CLIENT_SECRET_FILE", "client_secret.json")
TOKEN_FILE = os.getenv("GMAIL_TOKEN_FILE", "token.json")

EMAIL_REGEX = r"^[\w\.-]+@[\w\.-]+\.\w{2,}$"

def validate_email(email: str) -> bool:
    return bool(re.match(EMAIL_REGEX, email))

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


def create_message(sender: str, to: str, subject: str, message_text: str):
    # Basic validations
    if not sender or not to:
        raise ValueError("Sender and recipient cannot be empty.")

    if not validate_email(sender):
        raise ValueError(f"Invalid sender email address: {sender}")
    
    if not validate_email(to):
        raise ValueError(f"Invalid recipient email address: {to}")

    if not subject.strip():
        raise ValueError("Subject cannot be empty.")

    if not message_text.strip():
        raise ValueError("Message body cannot be empty.")
    
    message = MIMEText(message_text, "plain", "utf-8")
    message['to'] = to
    message['from'] = sender
    message['subject'] = subject
    raw = base64.urlsafe_b64encode(message.as_bytes())
    return {'raw': raw.decode()}


def send_email(sender: str, to: str, subject: str, message_text: str) -> bool:
    service = get_gmail_service()
    message = create_message(sender, to, subject, message_text)
    try:
        sent = service.users().messages().send(userId="me", body=message).execute()
        logger.info(f"Email sent. Message Id: {sent['id']}, To: {to}, Subject: {subject}")
        return True
    except Exception as e:
        logger.error(f"Error sending email to {to} with subject '{subject}': {e}")
        return False
