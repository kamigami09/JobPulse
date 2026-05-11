import bcrypt

# Dummy hash used to keep response time constant when user is not found,
# preventing timing-based user enumeration.
_DUMMY_HASH = "$2b$12$GhvMmNVjRW29ulnudl.LbuAnUtN/LRfe1JsBm1Vfeid0IHQn76a9K"


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt(rounds=12)).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    if not plain or not hashed:
        return False
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except (ValueError, TypeError):
        return False


def get_user_by_email(email: str):
    from app.models import User
    return User.query.filter_by(email=email.lower().strip()).first()


def authenticate_user(email: str, password: str):
    """Return User if credentials are valid, None otherwise. Always runs bcrypt."""
    user = get_user_by_email(email)
    if not user:
        verify_password(password, _DUMMY_HASH)
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user
