from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import (
    create_access_token,
    get_jwt_identity,
    jwt_required,
)

from app.utils.auth import check_credentials

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.route("/login", methods=["POST"])
def login():
    """Body: {username, password} → {access_token, username} or 401."""
    if not current_app.config.get("AUTH_USERNAME") or not current_app.config.get("AUTH_PASSWORD_HASH"):
        return jsonify({"error": "Auth is not configured on the server"}), 503

    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""

    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    if not check_credentials(username, password):
        return jsonify({"error": "Invalid credentials"}), 401

    token = create_access_token(identity=username)
    return jsonify({"access_token": token, "username": username})


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    """Lightweight endpoint for the frontend to verify a stored token on boot."""
    return jsonify({"username": get_jwt_identity()})
