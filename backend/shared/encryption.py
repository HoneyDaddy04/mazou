"""AES-256-GCM encryption for BYOK API keys."""

import base64
import os

from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes

from backend.shared.config import settings

# Derive a 32-byte AES key from the application secret
_SALT = b"mazou-byok-encryption-v1"  # fixed salt — key is per-deployment via secret_key


def _derive_key() -> bytes:
    """Derive a 32-byte AES-256 key from settings.secret_key using PBKDF2."""
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=_SALT,
        iterations=100_000,
    )
    return kdf.derive(settings.secret_key.encode("utf-8"))


# Cache the derived key at module level (same secret_key for the process lifetime)
_KEY = _derive_key()


def encrypt_key(plaintext: str) -> str:
    """
    Encrypt a plaintext API key with AES-256-GCM.
    Returns base64(nonce + ciphertext + tag).
    """
    nonce = os.urandom(12)  # 96-bit nonce for GCM
    aesgcm = AESGCM(_KEY)
    ciphertext_and_tag = aesgcm.encrypt(nonce, plaintext.encode("utf-8"), None)
    # AESGCM.encrypt returns ciphertext || tag (16 bytes)
    return base64.b64encode(nonce + ciphertext_and_tag).decode("ascii")


def decrypt_key(encrypted: str) -> str:
    """
    Decrypt a base64-encoded AES-256-GCM blob back to plaintext.
    Expects base64(nonce + ciphertext + tag).
    """
    raw = base64.b64decode(encrypted)
    nonce = raw[:12]
    ciphertext_and_tag = raw[12:]
    aesgcm = AESGCM(_KEY)
    plaintext = aesgcm.decrypt(nonce, ciphertext_and_tag, None)
    return plaintext.decode("utf-8")
