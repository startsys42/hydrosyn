import base64
import hashlib
from Crypto.Cipher import AES
from logger import logger
def openssl_decrypt(enc, password):
    # decodificar base64
    data = base64.b64decode(enc)

    # El formato de OpenSSL con salt es: "Salted__" + 8 bytes salt + datos cifrados
    if data[:8] != b"Salted__":
        raise ValueError("No encontrado encabezado Salted__")

    salt = data[8:16]
    ciphertext = data[16:]

    # Derivar key y iv con EVP_BytesToKey (MD5)
    key_iv = evp_bytes_to_key(password.encode(), salt, key_len=32, iv_len=16)
    key = key_iv[:32]
    iv = key_iv[32:]

    cipher = AES.new(key, AES.MODE_CBC, iv)
    decrypted = cipher.decrypt(ciphertext)

    # Quitar padding PKCS7
    padding_len = decrypted[-1]
    return decrypted[:-padding_len].decode('utf-8')

def evp_bytes_to_key(password, salt, key_len, iv_len):
    """
    Deriva key e IV usando método OpenSSL EVP_BytesToKey con MD5
    """
    dtot = b''
    d = b''
    while len(dtot) < (key_len + iv_len):
        d = hashlib.md5(d + password + salt).digest()
        dtot += d
    return dtot[:key_len + iv_len]



def descifrar_contrasena(texto_cifrado: str, clave_maestra: str) -> str:
    try:
        return openssl_decrypt(texto_cifrado, clave_maestra)
    except Exception as e:
        logger.error(f"Error en descifrado: {e}")
        raise
