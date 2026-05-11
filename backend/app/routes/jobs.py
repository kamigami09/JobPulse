import csv
import io
from datetime import datetime, timezone

from flask import Blueprint, jsonify, request, Response
from flask_jwt_extended import jwt_required
from sqlalchemy import func, case
from sqlalchemy.exc import IntegrityError

from app import db
from app.models import Job
from app.utils.url_utils import clean_url, validate_url

jobs_bp = Blueprint("jobs", __name__, url_prefix="/api/jobs")


@jobs_bp.route("/stats", methods=["GET"])
@jwt_required()
def get_stats():
    """Return job counts per status and funnel conversion rates."""
    row = db.session.query(
        func.count().label("total"),
        func.count(case((Job.status == "Saved",       1))).label("saved"),
        func.count(case((Job.status == "Applied",     1))).label("applied"),
        func.count(case((Job.status == "Interviewing",1))).label("interviewing"),
        func.count(case((Job.status == "Offer",       1))).label("offer"),
        func.count(case((Job.status == "Rejected",    1))).label("rejected"),
        func.count(case((Job.status == "needs_review",1))).label("needs_review"),
    ).one()

    total        = row.total
    applied      = row.applied
    interviewing = row.interviewing
    offer        = row.offer

    def rate(num, denom):
        return round(num / denom, 4) if denom else None

    return jsonify({
        "total": total,
        "counts": {
            "Saved":        row.saved,
            "Applied":      applied,
            "Interviewing": interviewing,
            "Offer":        offer,
            "Rejected":     row.rejected,
            "needs_review": row.needs_review,
        },
        "rates": {
            "response_rate":  rate(applied,      total),
            "interview_rate": rate(interviewing,  applied),
            "offer_rate":     rate(offer,         interviewing),
        },
    })


@jobs_bp.route("/export", methods=["GET"])
@jwt_required()
def export_csv():
    """Return all Saved jobs as a downloadable CSV."""
    jobs = Job.query.filter_by(status="Saved").order_by(Job.scraped_at.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Title", "Company", "Domain", "Skills", "Contact Email",
                     "URL", "Date Saved", "Notes"])
    for j in jobs:
        writer.writerow([
            j.title or "",
            j.company or "",
            j.domain or "",
            "; ".join(j.skills or []),
            j.contact_email or "",
            j.url,
            j.scraped_at.strftime("%Y-%m-%d") if j.scraped_at else "",
            j.notes or "",
        ])

    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    response = Response(output.getvalue(), status=200)
    response.headers["Content-Type"] = "text/csv; charset=utf-8"
    response.headers["Content-Disposition"] = f'attachment; filename="jobpulse-saved-{today}.csv"'
    return response


@jobs_bp.route("/scrape", methods=["POST"])
@jwt_required()
def scrape_job():
    """
    Scrape a job URL and save it. Returns existing record if URL already saved.
    Body: {"url": "https://..."}
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body must be JSON"}), 400

    url = (data.get("url") or "").strip()
    if not url:
        return jsonify({"error": "url is required"}), 400
    if not validate_url(url):
        return jsonify({"error": "Invalid or unsafe URL"}), 400

    cleaned = clean_url(url)

    # Return existing record if already saved (UNIQUE constraint)
    existing = Job.query.filter_by(url=cleaned).first()
    if existing:
        resp = existing.to_dict()
        resp["already_existed"] = True
        return jsonify(resp), 200

    # Import here to keep startup fast and avoid circular imports
    from app.scraper import scrape_job as do_scrape

    try:
        scraped = do_scrape(cleaned)
    except Exception as e:
        scraped = {
            "title": None, "company": None, "domain": None,
            "skills": [], "contact_email": None, "source": "other",
            "_needs_review": True,
        }

    status = "needs_review" if scraped.pop("_needs_review", False) else "Saved"
    scraped.pop("_layer_used", None)

    job = Job(
        url=cleaned,
        title=scraped.get("title"),
        company=scraped.get("company"),
        domain=scraped.get("domain"),
        skills=scraped.get("skills") or [],
        contact_email=scraped.get("contact_email"),
        source=scraped.get("source"),
        status=status,
    )
    db.session.add(job)

    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        # Race condition: another request saved the same URL simultaneously
        existing = Job.query.filter_by(url=cleaned).first()
        if existing:
            resp = existing.to_dict()
            resp["already_existed"] = True
            return jsonify(resp), 200
        return jsonify({"error": "Failed to save job"}), 500

    return jsonify(job.to_dict()), 201


@jobs_bp.route("", methods=["GET"])
@jwt_required()
def list_jobs():
    """Return all jobs, newest first. Supports ?status= filter."""
    status_filter = request.args.get("status")
    query = Job.query
    if status_filter:
        query = query.filter_by(status=status_filter)
    jobs = query.order_by(Job.scraped_at.desc()).all()
    return jsonify([j.to_dict() for j in jobs])


@jobs_bp.route("/<int:job_id>", methods=["PATCH"])
@jwt_required()
def update_job(job_id: int):
    """Partial update of any field. Sets applied_at automatically on first Applied transition."""
    job = Job.query.get_or_404(job_id)
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body must be JSON"}), 400

    allowed = {"title", "company", "domain", "skills", "contact_email",
               "status", "notes", "source"}

    for field in allowed:
        if field not in data:
            continue
        if field == "status":
            status = data["status"]
            if status not in Job.VALID_STATUSES:
                return jsonify({"error": f"Invalid status. Valid: {Job.VALID_STATUSES}"}), 400
            # Auto-set applied_at on first transition to Applied
            if status == "Applied" and job.applied_at is None:
                job.applied_at = datetime.now(timezone.utc)
            job.status = status
        elif field == "skills":
            skills = data["skills"]
            if isinstance(skills, str):
                skills = [s.strip() for s in skills.split(",") if s.strip()]
            job.skills = skills
        else:
            setattr(job, field, data[field])

    db.session.commit()
    return jsonify(job.to_dict())


@jobs_bp.route("/<int:job_id>", methods=["DELETE"])
@jwt_required()
def delete_job(job_id: int):
    job = Job.query.get_or_404(job_id)
    db.session.delete(job)
    db.session.commit()
    return "", 204
