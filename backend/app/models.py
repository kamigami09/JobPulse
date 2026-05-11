from sqlalchemy import func
from sqlalchemy.dialects.postgresql import ARRAY

from app import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    email = db.Column(db.Text, nullable=False, unique=True)
    password_hash = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, server_default=func.now())

    jobs = db.relationship(
        "Job",
        backref="owner",
        lazy="dynamic",
        cascade="all, delete-orphan",
    )
    resume_versions = db.relationship(
        "ResumeVersion",
        backref="owner",
        lazy="dynamic",
        cascade="all, delete-orphan",
    )

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class ResumeVersion(db.Model):
    __tablename__ = "resume_versions"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    label = db.Column(db.Text, nullable=False)
    filename = db.Column(db.Text, nullable=False)
    storage_path = db.Column(db.Text, nullable=False)
    file_size = db.Column(db.Integer, nullable=False)
    content_hash = db.Column(db.Text, nullable=False)
    notes = db.Column(db.Text, nullable=True)
    is_archived = db.Column(db.Boolean, nullable=False, default=False, server_default="false")
    created_at = db.Column(db.DateTime, nullable=False, server_default=func.now())

    def to_dict(self):
        return {
            "id": self.id,
            "label": self.label,
            "filename": self.filename,
            "file_size": self.file_size,
            "notes": self.notes,
            "is_archived": self.is_archived,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Job(db.Model):
    __tablename__ = "jobs"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    url = db.Column(db.Text, nullable=False)  # uniqueness enforced at (user_id, url) level in DB
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
    resume_version_id = db.Column(
        db.Integer,
        db.ForeignKey("resume_versions.id", ondelete="SET NULL"),
        nullable=True,
    )

    VALID_STATUSES = ["Saved", "Applied", "Interviewing", "Offer", "Rejected", "needs_review"]

    prep_tasks = db.relationship(
        "InterviewPrepTask",
        backref="job",
        lazy="dynamic",
        cascade="all, delete-orphan",
        order_by="InterviewPrepTask.position",
        foreign_keys="InterviewPrepTask.job_id",
    )
    resume_version = db.relationship(
        "ResumeVersion",
        foreign_keys=[resume_version_id],
    )

    def to_dict(self):
        rv = self.resume_version
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
            "resume_version": {"id": rv.id, "label": rv.label} if rv else None,
        }


class InterviewPrepTask(db.Model):
    __tablename__ = "interview_prep_tasks"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    job_id = db.Column(db.Integer, db.ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    text = db.Column(db.Text, nullable=False)
    category = db.Column(db.Text, nullable=False)
    done = db.Column(db.Boolean, nullable=False, default=False, server_default="false")
    position = db.Column(db.Integer, nullable=False, default=0, server_default="0")
    created_at = db.Column(db.DateTime, nullable=False, server_default=func.now())
    completed_at = db.Column(db.DateTime, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "job_id": self.job_id,
            "text": self.text,
            "category": self.category,
            "done": self.done,
            "position": self.position,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
        }


class ReminderLog(db.Model):
    __tablename__ = "reminder_log"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    kind = db.Column(db.Text, nullable=False)
    sent_at = db.Column(db.DateTime, nullable=False, server_default=func.now())
    recipient = db.Column(db.Text, nullable=False)
    job_count = db.Column(db.Integer, nullable=False)
    status = db.Column(db.Text, nullable=False)  # sent | failed | skipped
    error = db.Column(db.Text, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "kind": self.kind,
            "sent_at": self.sent_at.isoformat() if self.sent_at else None,
            "recipient": self.recipient,
            "job_count": self.job_count,
            "status": self.status,
            "error": self.error,
        }
