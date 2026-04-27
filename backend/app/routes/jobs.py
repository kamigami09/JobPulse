from flask import Blueprint, request, jsonify

from app import db
from app.models import Job
from app.utils.url_utils import clean_url, validate_url
from app.utils.extractor import extract_job_details

jobs_bp = Blueprint("jobs", __name__, url_prefix="/api/jobs")

CURRENT_USER_ID = "dev-user"  # Placeholder until auth is implemented


@jobs_bp.route("", methods=["POST"])
def create_job():
    """Create a new job application entry."""
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body must be JSON"}), 400

    url = (data.get("url") or "").strip()
    if not url:
        return jsonify({"error": "URL is required"}), 400

    if not validate_url(url):
        return jsonify({"error": "Invalid or unsafe URL"}), 400

    cleaned = clean_url(url)

    job = Job(
        user_id=CURRENT_USER_ID,
        url_original=url,
        url_clean=cleaned,
        title=data.get("title"),
        company=data.get("company"),
        location=data.get("location"),
        notes=data.get("notes"),
    )
    db.session.add(job)

    extraction_status = "manual"
    if not job.title and not job.company:
        ext = extract_job_details(cleaned)
        if ext["success"]:
            if ext["title"]: job.title = ext["title"]
            if ext["company"]: job.company = ext["company"]
            if ext["location"]: job.location = ext["location"]
            extraction_status = "success"
        else:
            extraction_status = ext["message"]

    db.session.commit()
    resp = job.to_dict()
    resp["extraction_status"] = extraction_status
    return jsonify(resp), 201


@jobs_bp.route("", methods=["GET"])
def list_jobs():
    """List all jobs for the current user, newest first."""
    jobs = (
        Job.query
        .filter_by(user_id=CURRENT_USER_ID)
        .order_by(Job.created_at.desc())
        .all()
    )
    return jsonify([j.to_dict() for j in jobs])


@jobs_bp.route("/<string:job_id>", methods=["GET"])
def get_job(job_id):
    """Get a single job by ID (must belong to current user)."""
    job = Job.query.filter_by(id=job_id, user_id=CURRENT_USER_ID).first()
    if not job:
        return jsonify({"error": "Job not found"}), 404
    return jsonify(job.to_dict())


@jobs_bp.route("/<string:job_id>", methods=["PUT"])
def update_job(job_id):
    """Update editable fields of a job."""
    job = Job.query.filter_by(id=job_id, user_id=CURRENT_USER_ID).first()
    if not job:
        return jsonify({"error": "Job not found"}), 404

    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body must be JSON"}), 400

    # Update allowed fields
    if "title" in data:
        job.title = data["title"]
    if "company" in data:
        job.company = data["company"]
    if "location" in data:
        job.location = data["location"]
    if "notes" in data:
        job.notes = data["notes"]
    if "status" in data:
        status = data["status"].upper()
        if status not in Job.VALID_STATUSES:
            return jsonify({
                "error": f"Invalid status. Must be one of: {', '.join(Job.VALID_STATUSES)}"
            }), 400
        job.status = status

    db.session.commit()
    return jsonify(job.to_dict())
