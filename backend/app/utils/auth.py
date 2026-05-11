"""Bcrypt + credential verification helpers for single-user auth."""

import hmac

import bcrypt
from flask import current_app


def hash_password(plain: str) -> str:
    """Generate a bcrypt hash. Used by the CLI helper script."""
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    """Constant-time bcrypt comparison. Returns False on any error."""
    if not plain or not hashed:
        return False
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except (ValueError, TypeError):
        return False


def check_credentials(username: str, password: str) -> bool:
    """Verify both username and password against the .env-configured values."""
    expected_username = current_app.config.get("AUTH_USERNAME") or ""
    expected_hash = current_app.config.get("AUTH_PASSWORD_HASH") or ""

    if not expected_username or not expected_hash:
        return False

    # Constant-time username comparison + bcrypt-paced password check.
    # Always run bcrypt even on username mismatch to keep response time uniform.
    username_ok = hmac.compare_digest(username or "", expected_username)
    password_ok = verify_password(password, expected_hash)
    return username_ok and password_ok
