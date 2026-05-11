import os

from flask import Blueprint, current_app, jsonify, request, send_file
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError

from app import db
from app.models import Job, ResumeVersion
from app.services.resume_storage import delete_resume_file, get_resume_abs_path, save_resume
from app.utils.pdf import validate_pdf

resumes_bp = Blueprint("resumes", __name__, url_prefix="/api/resumes")


def _uid() -> int:
    return int(get_jwt_identity())


@resumes_bp.route("", methods=["GET"])
@jwt_required()
def list_resumes():
    uid = _uid()
    include_archived = request.args.get("include_archived") == "1"
    q = (
        db.session.query(ResumeVersion, func.count(Job.id).label("job_count"))
        .outerjoin(
            Job,
            (Job.resume_version_id == ResumeVersion.id) & (Job.user_id == uid),
        )
        .filter(ResumeVersion.user_id == uid)
        .group_by(ResumeVersion.id)
    )
    if not include_archived:
        q = q.filter(ResumeVersion.is_archived == False)  # noqa: E712
    results = q.order_by(ResumeVersion.created_at.desc()).all()
    return jsonify([{**v.to_dict(), "job_count": count} for v, count in results])


@resumes_bp.route("", methods=["POST"])
@jwt_required()
def upload_resume():
    uid = _uid()
    if "file" not in request.files:
        return jsonify({"error": "file field is required"}), 400
    file = request.files["file"]
    label = (request.form.get("label") or "").strip()
    if not label:
        return jsonify({"error": "label is required"}), 400
    notes = (request.form.get("notes") or "").strip() or None

    file_bytes = file.read()
    err = validate_pdf(file_bytes)
    if err:
        return jsonify({"error": err}), 400

    stored = save_resume(uid, file_bytes, file.filename or "resume.pdf")
    version = ResumeVersion(
        user_id=uid,
        label=label,
        filename=file.filename or "resume.pdf",
        storage_path=stored["storage_path"],
        file_size=len(file_bytes),
        content_hash=stored["content_hash"],
        notes=notes,
    )
    db.session.add(version)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        delete_resume_file(stored["storage_path"])
        return jsonify({"error": f"A resume labelled '{label}' already exists"}), 409

    return jsonify(version.to_dict()), 201


@resumes_bp.route("/<int:version_id>", methods=["PATCH"])
@jwt_required()
def update_resume(version_id: int):
    uid = _uid()
    version = ResumeVersion.query.get_or_404(version_id)
    if version.user_id != uid:
        return jsonify({"error": "Not found"}), 404

    data = request.get_json(silent=True) or {}
    if "label" in data:
        label = (data["label"] or "").strip()
        if not label:
            return jsonify({"error": "label cannot be empty"}), 400
        version.label = label
    if "notes" in data:
        version.notes = (data["notes"] or "").strip() or None
    if "is_archived" in data:
        version.is_archived = bool(data["is_archived"])

    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "A resume with that label already exists"}), 409

    return jsonify(version.to_dict())


@resumes_bp.route("/<int:version_id>", methods=["DELETE"])
@jwt_required()
def delete_resume(version_id: int):
    uid = _uid()
    version = ResumeVersion.query.get_or_404(version_id)
    if version.user_id != uid:
        return jsonify({"error": "Not found"}), 404

    in_use = Job.query.filter_by(user_id=uid, resume_version_id=version_id).count()
    if in_use:
        return jsonify({
            "error": f"Cannot delete: {in_use} job(s) use this resume. Archive it instead.",
            "in_use": in_use,
        }), 409

    storage_path = version.storage_path
    db.session.delete(version)
    db.session.commit()
    delete_resume_file(storage_path)
    return "", 204


@resumes_bp.route("/<int:version_id>/download", methods=["GET"])
@jwt_required()
def download_resume(version_id: int):
    uid = _uid()
    version = ResumeVersion.query.get_or_404(version_id)
    if version.user_id != uid:
        return jsonify({"error": "Not found"}), 404

    abs_path = get_resume_abs_path(version.storage_path)
    upload_dir = os.path.realpath(current_app.config["UPLOAD_DIR"])
    if not os.path.realpath(abs_path).startswith(upload_dir + os.sep):
        return jsonify({"error": "Invalid path"}), 400
    if not os.path.exists(abs_path):
        return jsonify({"error": "File not found on disk"}), 404

    return send_file(
        abs_path,
        mimetype="application/pdf",
        as_attachment=True,
        download_name=version.filename,
    )


@resumes_bp.route("/<int:version_id>/usage", methods=["GET"])
@jwt_required()
def resume_usage(version_id: int):
    uid = _uid()
    version = ResumeVersion.query.get_or_404(version_id)
    if version.user_id != uid:
        return jsonify({"error": "Not found"}), 404

    jobs = (
        Job.query
        .filter_by(user_id=uid, resume_version_id=version_id)
        .order_by(Job.scraped_at.desc())
        .all()
    )
    return jsonify({
        "count": len(jobs),
        "jobs": [
            {"id": j.id, "title": j.title, "company": j.company, "status": j.status}
            for j in jobs
        ],
    })
