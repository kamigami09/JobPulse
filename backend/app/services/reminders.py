import logging
from datetime import datetime, timedelta, timezone

from flask import current_app, render_template

from app import db
from app.models import Job, ReminderLog
from app.services.digest import build_digest
from app.services.email import send_email

logger = logging.getLogger(__name__)

WEEKLY_KIND = "weekly_digest"
IDEMPOTENCY_WINDOW_HOURS = 12


def _smtp_configured() -> bool:
    return bool(current_app.config.get("SMTP_USER") and current_app.config.get("SMTP_PASSWORD"))


def _recipient_configured() -> bool:
    return bool(current_app.config.get("REMINDER_TO"))


def send_weekly_digest(dry_run: bool = False, force: bool = False) -> dict:
    """
    Build and send the weekly digest email.
    Returns a result dict with keys: status, job_count, message.
    """
    cfg = current_app.config

    if not _smtp_configured():
        return {"status": "error", "job_count": 0, "message": "SMTP_USER or SMTP_PASSWORD not set"}
    if not _recipient_configured():
        return {"status": "error", "job_count": 0, "message": "REMINDER_TO not set"}

    if not force and _sent_recently():
        return {"status": "skipped", "job_count": 0,
                "message": f"Already sent within {IDEMPOTENCY_WINDOW_HOURS}h — use --force to override"}

    jobs = Job.query.all()
    digest = build_digest(jobs)

    if digest["total"] == 0:
        _log(WEEKLY_KIND, cfg["REMINDER_TO"], 0, "skipped")
        return {"status": "skipped", "job_count": 0, "message": "No jobs to include in digest"}

    generated_date = datetime.now(timezone.utc).strftime("%A, %d %B %Y")
    html = render_template("email/weekly_digest.html", digest=digest, generated_date=generated_date)
    text = render_template("email/weekly_digest.txt", digest=digest, generated_date=generated_date)
    subject = f"JobPulse — {digest['total']} job(s) need your attention"

    if dry_run:
        logger.info("[DRY RUN] Would send to=%s subject=%r job_count=%d",
                    cfg["REMINDER_TO"], subject, digest["total"])
        return {"status": "dry_run", "job_count": digest["total"], "message": "Dry run — nothing sent", "html": html}

    try:
        send_email(
            host=cfg["SMTP_HOST"],
            port=cfg["SMTP_PORT"],
            user=cfg["SMTP_USER"],
            password=cfg["SMTP_PASSWORD"],
            from_addr=cfg["REMINDER_FROM"],
            to_addr=cfg["REMINDER_TO"],
            subject=subject,
            html=html,
            text=text,
        )
        _log(WEEKLY_KIND, cfg["REMINDER_TO"], digest["total"], "sent")
        return {"status": "sent", "job_count": digest["total"], "message": f"Sent to {cfg['REMINDER_TO']}"}
    except Exception as exc:
        err = str(exc)
        logger.error("Failed to send reminder: %s", err)
        _log(WEEKLY_KIND, cfg["REMINDER_TO"], digest["total"], "failed", error=err)
        return {"status": "failed", "job_count": digest["total"], "message": err}


def _sent_recently() -> bool:
    cutoff = datetime.now(timezone.utc) - timedelta(hours=IDEMPOTENCY_WINDOW_HOURS)
    return db.session.query(
        ReminderLog.query.filter(
            ReminderLog.kind == WEEKLY_KIND,
            ReminderLog.status == "sent",
            ReminderLog.sent_at >= cutoff,
        ).exists()
    ).scalar()


def _log(kind: str, recipient: str, job_count: int, status: str, error: str | None = None) -> None:
    entry = ReminderLog(
        kind=kind,
        sent_at=datetime.now(timezone.utc),
        recipient=recipient,
        job_count=job_count,
        status=status,
        error=error,
    )
    db.session.add(entry)
    db.session.commit()


def get_history(limit: int = 10) -> list:
    rows = ReminderLog.query.order_by(ReminderLog.sent_at.desc()).limit(limit).all()
    return [r.to_dict() for r in rows]
