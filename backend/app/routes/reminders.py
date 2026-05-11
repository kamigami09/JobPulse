from flask import Blueprint, Response, current_app, jsonify, render_template, request
from flask_jwt_extended import jwt_required

from app.services.reminders import get_history, send_weekly_digest
from app.services.digest import build_digest
from app.models import Job

reminders_bp = Blueprint("reminders", __name__, url_prefix="/api/reminders")


@reminders_bp.route("/config", methods=["GET"])
@jwt_required()
def get_config():
    """Return whether reminders are configured (SMTP + recipient present)."""
    cfg = current_app.config
    smtp_ok = bool(cfg.get("SMTP_USER") and cfg.get("SMTP_PASSWORD"))
    to_ok = bool(cfg.get("REMINDER_TO"))
    return jsonify({
        "enabled": cfg.get("REMINDERS_ENABLED", False),
        "smtp_configured": smtp_ok,
        "recipient_configured": to_ok,
        "ready": smtp_ok and to_ok,
        "recipient": cfg.get("REMINDER_TO", "") if to_ok else "",
    })


@reminders_bp.route("/send-now", methods=["POST"])
@jwt_required()
def send_now():
    """Manually trigger the weekly digest. Accepts ?force=true to bypass idempotency."""
    cfg = current_app.config
    if not (cfg.get("SMTP_USER") and cfg.get("SMTP_PASSWORD")):
        return jsonify({"error": "SMTP not configured. Set SMTP_USER and SMTP_PASSWORD in .env."}), 503
    if not cfg.get("REMINDER_TO"):
        return jsonify({"error": "REMINDER_TO not set in .env."}), 503

    force = request.args.get("force", "").lower() == "true"
    result = send_weekly_digest(dry_run=False, force=force)

    status_code = 200
    if result["status"] == "failed":
        status_code = 502
    elif result["status"] == "error":
        status_code = 503

    return jsonify(result), status_code


@reminders_bp.route("/history", methods=["GET"])
@jwt_required()
def history():
    """Return the last 10 reminder log entries."""
    return jsonify(get_history(limit=10))


@reminders_bp.route("/preview", methods=["GET"])
@jwt_required()
def preview():
    """Render the digest HTML without sending. Returns text/html."""
    from datetime import datetime, timezone
    from flask_jwt_extended import get_jwt_identity
    jobs = Job.query.filter_by(user_id=int(get_jwt_identity())).all()
    digest = build_digest(jobs)
    generated_date = datetime.now(timezone.utc).strftime("%A, %d %B %Y")
    html = render_template("email/weekly_digest.html", digest=digest, generated_date=generated_date)
    return Response(html, status=200, mimetype="text/html")
