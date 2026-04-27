import os


class Config:
    # In Docker: DATABASE_URL is set to postgresql://...
    # Locally without Docker: falls back to SQLite
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL",
        "sqlite:///jobpulse_dev.db"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-key-change-in-prod")
