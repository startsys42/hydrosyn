import os
import base64
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from email.mime.text import MIMEText

# Configuración inicial
SCOPES = ['https://www.googleapis.com/auth/gmail.send']
CLIENT_SECRET_FILE = 'credentials.json'  # Archivo descargado de Google Cloud

def get_gmail_service():
 
    creds = None
    
    # El archivo token.json guarda los tokens de acceso/refresh
    if os.path.exists('token.json'):
        creds = Credentials.from_authorized_user_file('token.json', SCOPES)
    
    # Si no hay credenciales válidas, haz el flujo OAuth
    if not creds or not creds.valid:
        flow = InstalledAppFlow.from_client_secrets_file(
            CLIENT_SECRET_FILE, SCOPES)
        creds = flow.run_local_server(port=0)
        
        # Guarda las credenciales para la próxima vez
        with open('token.json', 'w') as token:
            token.write(creds.to_json())
    
    return build('gmail', 'v1', credentials=creds)

def create_message(sender, to, subject, message_text):
    """Crea un mensaje email listo para enviar"""
    message = MIMEText(message_text)
    message['to'] = to
    message['from'] = sender
    message['subject'] = subject
    
    # Codificar en base64url
    raw = base64.urlsafe_b64encode(message.as_bytes())
    return {'raw': raw.decode()}

def send_email(service, user_id, message):
    """Envía el email usando la API de Gmail"""
    try:
        message = (service.users().messages().send(
            userId=user_id,
            body=message).execute())
        print(f"Email enviado. Message Id: {message['id']}")
        return True
    except Exception as e:
        print(f"Error al enviar email: {e}")
        return False

# Ejemplo de uso
if __name__ == '__main__':
    service = get_gmail_service()
    
    message = create_message(
        sender='tu-email@gmail.com',  # Debe ser el mismo de la autenticación
        to='destinatario@example.com',
        subject='Prueba de email desde Python',
        message_text='Este es un mensaje de prueba enviado usando la API de Gmail con OAuth 2.0'
    )
    
    send_email(service, 'me', message)  # 'me' representa al usuario autenticado
