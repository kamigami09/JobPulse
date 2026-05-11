import re

_EMAIL_RE = re.compile(r'^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$')
_SPECIAL = set('!@#$%^&*()-_=+[]{}|;:,.<>?')


def validate_email(email: str) -> bool:
    return bool(_EMAIL_RE.match(email or ""))


def validate_password(password: str) -> list[str]:
    """Return list of unmet criteria labels. Empty list means password is valid."""
    p = password or ""
    unmet = []
    if len(p) < 8:
        unmet.append("At least 8 characters")
    if len(p) > 128:
        unmet.append("Maximum 128 characters")
    if not any(c.isupper() for c in p):
        unmet.append("At least one uppercase letter")
    if not any(c.islower() for c in p):
        unmet.append("At least one lowercase letter")
    if not any(c.isdigit() for c in p):
        unmet.append("At least one number")
    if not any(c in _SPECIAL for c in p):
        unmet.append("At least one special character (!@#$%^&* etc.)")
    return unmet
