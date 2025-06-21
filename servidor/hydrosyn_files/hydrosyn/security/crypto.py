import base64
import hashlib
from Crypto.Cipher import AES
from logger import logger
def openssl_decrypt(enc, password):
    data = base64.b64decode(enc)

    if data[:8] != b"Salted__":
        raise ValueError("No encontrado encabezado Salted__")

    salt = data[8:16]
    ciphertext = data[16:]

    # Derivar key e IV con PBKDF2 (OpenSSL usa 10000 iteraciones y sha256)
    key_iv = pbkdf2_bytes_to_key(password.encode(), salt, key_len=32, iv_len=16, iterations=10000)
    key = key_iv[:32]
    iv = key_iv[32:]

    cipher = AES.new(key, AES.MODE_CBC, iv)
    decrypted = cipher.decrypt(ciphertext)

    # Quitar padding PKCS7
    padding_len = decrypted[-1]
    return decrypted[:-padding_len].decode('utf-8')

def pbkdf2_bytes_to_key(password, salt, key_len, iv_len, iterations):
    # PBKDF2 para derivar key + iv concatenados
    from Crypto.Protocol.KDF import PBKDF2
    dk_len = key_len + iv_len
    key_iv = PBKDF2(password, salt, dk_len, count=iterations, hmac_hash_module=hashlib.sha256)
    return key_iv


def descifrar_contrasena(texto_cifrado: str, clave_maestra: str) -> str:
    try:
        return openssl_decrypt(texto_cifrado, clave_maestra)
    except Exception as e:
        logger.error(f"Error en descifrado: {e}")
        raise
