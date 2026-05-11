from datetime import datetime, timezone

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from sqlalchemy import func as sqlfunc

from app import db
from app.models import InterviewPrepTask, Job

prep_bp = Blueprint("prep", __name__)


@prep_bp.route("/api/jobs/<int:job_id>/prep", methods=["GET"])
@jwt_required()
def list_prep(job_id):
    Job.query.get_or_404(job_id)
    tasks = InterviewPrepTask.query.filter_by(job_id=job_id).order_by(InterviewPrepTask.position).all()
    return jsonify([t.to_dict() for t in tasks])


@prep_bp.route("/api/jobs/<int:job_id>/prep/seed", methods=["POST"])
@jwt_required()
def seed_prep(job_id):
    job = Job.query.get_or_404(job_id)
    from app.services.prep_service import seed_default
    seed_default(job, db)
    db.session.commit()
    tasks = InterviewPrepTask.query.filter_by(job_id=job_id).order_by(InterviewPrepTask.position).all()
    return jsonify([t.to_dict() for t in tasks])


@prep_bp.route("/api/jobs/<int:job_id>/prep", methods=["POST"])
@jwt_required()
def create_prep(job_id):
    Job.query.get_or_404(job_id)
    data = request.get_json(silent=True)
    if not data or not (data.get("text") or "").strip():
        return jsonify({"error": "text is required"}), 400

    max_pos = db.session.query(sqlfunc.max(InterviewPrepTask.position)).filter_by(job_id=job_id).scalar() or 0
    task = InterviewPrepTask(
        job_id=job_id,
        text=data["text"].strip(),
        category=data.get("category", "logistics"),
        position=max_pos + 1,
    )
    db.session.add(task)
    db.session.commit()
    return jsonify(task.to_dict()), 201


@prep_bp.route("/api/prep/<int:task_id>", methods=["PATCH"])
@jwt_required()
def update_prep(task_id):
    task = InterviewPrepTask.query.get_or_404(task_id)
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body must be JSON"}), 400

    if "done" in data:
        task.done = bool(data["done"])
        task.completed_at = datetime.now(timezone.utc) if task.done else None
    if "text" in data and (data["text"] or "").strip():
        task.text = data["text"].strip()
    if "category" in data:
        task.category = data["category"]

    db.session.commit()
    return jsonify(task.to_dict())


@prep_bp.route("/api/prep/<int:task_id>", methods=["DELETE"])
@jwt_required()
def delete_prep(task_id):
    task = InterviewPrepTask.query.get_or_404(task_id)
    db.session.delete(task)
    db.session.commit()
    return "", 204


@prep_bp.route("/api/jobs/<int:job_id>/prep/reorder", methods=["PATCH"])
@jwt_required()
def reorder_prep(job_id):
    Job.query.get_or_404(job_id)
    data = request.get_json(silent=True)
    ordered_ids = data.get("ordered_ids") if data else None
    if not isinstance(ordered_ids, list):
        return jsonify({"error": "ordered_ids must be a list"}), 400

    tasks_map = {t.id: t for t in InterviewPrepTask.query.filter_by(job_id=job_id).all()}
    for pos, task_id in enumerate(ordered_ids):
        if task_id in tasks_map:
            tasks_map[task_id].position = pos
    db.session.commit()
    return jsonify({"ok": True})


@prep_bp.route("/api/prep/stats", methods=["GET"])
@jwt_required()
def prep_stats():
    pending = (
        db.session.query(sqlfunc.count(InterviewPrepTask.id))
        .join(Job, Job.id == InterviewPrepTask.job_id)
        .filter(Job.status == "Interviewing", InterviewPrepTask.done == False)  # noqa: E712
        .scalar()
    ) or 0
    interviewing = Job.query.filter_by(status="Interviewing").count()
    return jsonify({"pending_tasks": pending, "interviewing_jobs": interviewing})
