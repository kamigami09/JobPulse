from sqlalchemy import func
from sqlalchemy.dialects.postgresql import ARRAY

from app import db


class Job(db.Model):
    __tablename__ = "jobs"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    url = db.Column(db.Text, nullable=False, unique=True)
    title = db.Column(db.Text, nullable=True)
    company = db.Column(db.Text, nullable=True)
    domain = db.Column(db.Text, nullable=True)
    skills = db.Column(ARRAY(db.Text), nullable=True)
    contact_email = db.Column(db.Text, nullable=True)
    status = db.Column(db.Text, nullable=False, default="Saved", server_default="Saved")
    notes = db.Column(db.Text, nullable=True)
    source = db.Column(db.Text, nullable=True)
    scraped_at = db.Column(db.DateTime, nullable=False, server_default=func.now())
    applied_at = db.Column(db.DateTime, nullable=True)

    VALID_STATUSES = ["Saved", "Applied", "Interviewing", "Offer", "Rejected", "needs_review"]

    def to_dict(self):
        return {
            "id": self.id,
            "url": self.url,
            "title": self.title,
            "company": self.company,
            "domain": self.domain,
            "skills": self.skills or [],
            "contact_email": self.contact_email,
            "status": self.status,
            "notes": self.notes,
            "source": self.source,
            "scraped_at": self.scraped_at.isoformat() if self.scraped_at else None,
            "applied_at": self.applied_at.isoformat() if self.applied_at else None,
        }
