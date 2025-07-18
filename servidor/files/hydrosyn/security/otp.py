import secrets
import string
import pyotp

def generate_secure_totp_secret():
    """
    Generates a secure 32-character Base32 secret for TOTP (used in 2FA apps).
    """
    alphabet = string.ascii_uppercase + "234567"  # Valid Base32 characters
    return ''.join(secrets.choice(alphabet) for _ in range(32))

def verify_totp_code(secret, user_code):
    """
    Verifies a 6-digit TOTP code entered by the user using the shared secret.
    Returns True if valid, False otherwise.
    """
    totp = pyotp.TOTP(secret)
    return totp.verify(user_code)
