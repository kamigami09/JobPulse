import uuid
from datetime import datetime, timezone

from app import db


class Job(db.Model):
    __tablename__ = "jobs"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(100), nullable=False, default="dev-user", index=True)

    # URL fields
    url_original = db.Column(db.String(2048), nullable=False)
    url_clean = db.Column(db.String(2048), nullable=False)

    # Job info (may be auto-filled or manually entered)
    title = db.Column(db.String(500), nullable=True)
    company = db.Column(db.String(300), nullable=True)
    location = db.Column(db.String(300), nullable=True)

    # Status tracking
    status = db.Column(db.String(50), nullable=False, default="SAVED")

    # Notes
    notes = db.Column(db.Text, nullable=True)

    # Timestamps
    created_at = db.Column(
        db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Valid statuses
    VALID_STATUSES = ["SAVED", "APPLIED", "INTERVIEW", "OFFER", "REJECTED", "CLOSED"]

    def to_dict(self):
        """Serialize job to a JSON-safe dictionary."""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "url_original": self.url_original,
            "url_clean": self.url_clean,
            "title": self.title,
            "company": self.company,
            "location": self.location,
            "status": self.status,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

class UserSettings(db.Model):
    __tablename__ = "user_settings"
    user_id = db.Column(db.String(100), primary_key=True)
    timezone = db.Column(db.String(100), default="UTC")

    def to_dict(self):
        return {"user_id": self.user_id, "timezone": self.timezone}
