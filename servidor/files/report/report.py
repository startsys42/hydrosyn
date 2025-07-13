import os
import re
import sys
import base64
import argparse
from email.message import EmailMessage
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

SCOPES = ["https://www.googleapis.com/auth/gmail.send"]

def is_valid_email(email: str) -> bool:
    """Check if email has valid format."""
    pattern = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
    return re.match(pattern, email) is not None

def validate_emails(emails: list) -> None:
    """Raise error if any email is invalid."""
    for email in emails:
        if not is_valid_email(email):
            raise ValueError(f"Invalid email format: {email}")

def get_gmail_service(token_file="token.json", creds_file="credentials.json"):
    """Get authenticated Gmail service."""
    creds = None
    if os.path.exists(token_file):
        creds = Credentials.from_authorized_user_file(token_file, SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(creds_file, SCOPES)
            creds = flow.run_local_server(port=0)
        with open(token_file, "w") as token:
            token.write(creds.to_json())
    return build("gmail", "v1", credentials=creds)

def send_email(
    service,
    sender: str,
    recipients: list,
    subject: str,
    body: str,
    attachments: list = None,
):
    """Send email using Gmail API."""
    validate_emails([sender] + recipients)

    message = EmailMessage()
    message.set_content(body)
    message["To"] = ", ".join(recipients)
    message["From"] = sender
    message["Subject"] = subject

    if attachments:
        for file_path in attachments:
            try:
                with open(file_path, "rb") as f:
                    file_data = f.read()
                message.add_attachment(
                    file_data,
                    maintype="application",
                    subtype="octet-stream",
                    filename=os.path.basename(file_path),
                )
            except Exception as e:
                print(f"Error attaching {file_path}: {e}", file=sys.stderr)

    raw = base64.urlsafe_b64encode(message.as_bytes()).decode()
    service.users().messages().send(userId="me", body={"raw": raw}).execute()
    print("Email sent successfully!")

def main():
    """Command line execution."""
    parser = argparse.ArgumentParser(
        description="Send emails using Gmail API",
        formatter_class=argparse.RawTextHelpFormatter,
    )
    
    # Positional arguments (no -- prefix)
    parser.add_argument("sender", help="Your email address (must match token)")
    parser.add_argument("recipients", nargs="+", help="Recipient emails (space separated)")
    parser.add_argument("subject", help="Email subject")
    parser.add_argument("body", help="Email body text")
    parser.add_argument("-a", "--attachments", nargs="*", help="Files to attach", default=[])

    args = parser.parse_args()

    try:
        validate_emails([args.sender] + args.recipients)
        service = get_gmail_service()
        send_email(
            service=service,
            sender=args.sender,
            recipients=args.recipients,
            subject=args.subject,
            body=args.body,
            attachments=args.attachments,
        )
    except ValueError as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Unexpected error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
