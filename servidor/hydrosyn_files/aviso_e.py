import os
import os.path
import base64
import argparse
from email.message import EmailMessage
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

SCOPES = ['https://www.googleapis.com/auth/gmail.send']

def enviar_correo(service, remitente, destinatario, asunto, cuerpo, adjuntos=None):
    message = EmailMessage()
    message.set_content(cuerpo)
    message['To'] = destinatario
    message['From'] = remitente
    message['Subject'] = asunto

    if adjuntos:
        for ruta in adjuntos:
            try:
                with open(ruta, 'rb') as f:
                    data = f.read()
                message.add_attachment(data, maintype='application', subtype='octet-stream', filename=os.path.basename(ruta))
            except Exception as e:
                print(f"Error al adjuntar archivo {ruta}: {e}")

    raw = base64.urlsafe_b64encode(message.as_bytes()).decode()
    body = {'raw': raw}
    service.users().messages().send(userId='me', body=body).execute()
    print("Correo enviado!")

def main():
    parser = argparse.ArgumentParser(description='Enviar correo con Gmail API.')
    parser.add_argument('--from', dest='remitente', required=True, help='Correo remitente')
    parser.add_argument('--to', dest='destinatario', required=True, help='Correo destinatario')
    parser.add_argument('--subject', dest='asunto', required=True, help='Asunto del correo')
    parser.add_argument('--body', dest='cuerpo', required=True, help='Contenido del correo')
    parser.add_argument('--attach', dest='adjuntos', nargs='*', help='Archivos a adjuntar', default=None)

    args = parser.parse_args()

    creds = None
    if os.path.exists('token.json'):
        creds = Credentials.from_authorized_user_file('token.json', SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file('crd.json', SCOPES)
            creds = flow.run_console()
        with open('token.json', 'w') as token:
            token.write(creds.to_json())

    service = build('gmail', 'v1', credentials=creds)

    enviar_correo(
        service,
        remitente=args.remitente,
        destinatario=args.destinatario,
        asunto=args.asunto,
        cuerpo=args.cuerpo,
        adjuntos=args.adjuntos
    )

if __name__ == '__main__':
    main()
