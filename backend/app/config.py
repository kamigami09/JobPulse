import os
from dotenv import load_dotenv

load_dotenv()


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
