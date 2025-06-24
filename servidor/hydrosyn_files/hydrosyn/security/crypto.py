import base64
#import hashlib
from Crypto.Cipher import AES
from Crypto.Protocol.KDF import PBKDF2
from Crypto.Hash import SHA256  
from logger import logger

def openssl_decrypt(enc: str, password: str) -> str:
    try:
        data = base64.b64decode(enc)

        if data[:8] != b"Salted__":
            raise ValueError("No encontrado encabezado Salted__")

        salt = data[8:16]
        ciphertext = data[16:]

        # Derivar key e IV con PBKDF2 (OpenSSL usa 10000 iteraciones y SHA256)
        key_iv = PBKDF2(password.encode(), salt, dkLen=48, count=10000, hmac_hash_module=SHA56)
        key = key_iv[:32]
        iv = key_iv[32:]

        cipher = AES.new(key, AES.MODE_CBC, iv)
        decrypted = cipher.decrypt(ciphertext)

        # Quitar padding PKCS7
        padding_len = decrypted[-1]
        if padding_len < 1 or padding_len > AES.block_size:
            raise ValueError(f"Padding inválido: {padding_len}")

        return decrypted[:-padding_len].decode('utf-8')

    except Exception as e:
        logger.error(f"Error en openssl_decrypt: {e}")
        raise

def descifrar_contrasena(texto_cifrado: str, clave_maestra: str) -> str:
    return openssl_decrypt(texto_cifrado, clave_maestra)

