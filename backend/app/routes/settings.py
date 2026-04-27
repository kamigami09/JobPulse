from flask import Blueprint, request, jsonify, send_file
import json
import io
from app import db
from app.models import Job, UserSettings

settings_bp = Blueprint("settings", __name__, url_prefix="/api/settings")

CURRENT_USER_ID = "dev-user"

@settings_bp.route("", methods=["GET"])
def get_settings():
    settings = UserSettings.query.get(CURRENT_USER_ID)
    if not settings:
        settings = UserSettings(user_id=CURRENT_USER_ID)
        db.session.add(settings)
        db.session.commit()
    return jsonify(settings.to_dict())

@settings_bp.route("", methods=["PUT"])
def update_settings():
    data = request.get_json()
    settings = UserSettings.query.get(CURRENT_USER_ID)
    if not settings:
        settings = UserSettings(user_id=CURRENT_USER_ID)
        db.session.add(settings)
    
    if "timezone" in data:
        settings.timezone = data["timezone"]
        
    db.session.commit()
    return jsonify(settings.to_dict())

@settings_bp.route("/export", methods=["GET"])
def export_data():
    jobs = Job.query.filter_by(user_id=CURRENT_USER_ID).all()
    jobs_list = [j.to_dict() for j in jobs]
    
    json_str = json.dumps(jobs_list, indent=2)
    
    return send_file(
        io.BytesIO(json_str.encode('utf-8')),
        mimetype='application/json',
        as_attachment=True,
        download_name='jobpulse_export.json'
    )

@settings_bp.route("/delete-data", methods=["DELETE"])
def delete_data():
    Job.query.filter_by(user_id=CURRENT_USER_ID).delete()
    db.session.commit()
    return jsonify({"message": "All data deleted"})
