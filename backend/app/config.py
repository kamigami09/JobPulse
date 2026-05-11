import os
from datetime import timedelta

from dotenv import load_dotenv

load_dotenv()

_base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class Config:
    DATABASE_URL = os.environ.get("DATABASE_URL")
    if not DATABASE_URL:
        raise RuntimeError(
            "DATABASE_URL is not set. Create a backend/.env file with "
            "DATABASE_URL=postgresql://jobpulse:jobpulse@localhost:5432/jobpulse"
        )
    SQLALCHEMY_DATABASE_URI = DATABASE_URL
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-key-change-in-prod")

    # Auth — single-user credentials live in .env
    AUTH_USERNAME = os.environ.get("AUTH_USERNAME", "")
    AUTH_PASSWORD_HASH = os.environ.get("AUTH_PASSWORD_HASH", "")

    # JWT — uses its own secret so rotating sessions doesn't invalidate Flask signing
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY") or SECRET_KEY
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=30)
    JWT_ERROR_MESSAGE_KEY = "error"

    # Email reminders — disabled unless REMINDERS_ENABLED=true and SMTP creds are set
    REMINDERS_ENABLED = os.environ.get("REMINDERS_ENABLED", "false").lower() == "true"
    SMTP_HOST = os.environ.get("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
    SMTP_USER = os.environ.get("SMTP_USER", "")
    SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "")  # Gmail app password
    REMINDER_FROM = os.environ.get("REMINDER_FROM", "") or os.environ.get("SMTP_USER", "")
    REMINDER_TO = os.environ.get("REMINDER_TO", "")
    REMINDER_TIMEZONE = os.environ.get("REMINDER_TIMEZONE", "Europe/Paris")

    # Resume uploads — PDFs stored on disk
    UPLOAD_DIR = os.environ.get("UPLOAD_DIR", os.path.join(_base_dir, "uploads"))
    MAX_CONTENT_LENGTH = 6 * 1024 * 1024  # 6 MB to accommodate multipart overhead
