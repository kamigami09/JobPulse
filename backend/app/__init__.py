from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
limiter = Limiter(key_func=get_remote_address, default_limits=[], storage_uri="memory://")


def create_app():
    app = Flask(__name__)
    app.config.from_object("app.config.Config")

    CORS(
        app,
        resources={r"/api/*": {"origins": "*"}},
        allow_headers=["Content-Type", "Authorization"],
        expose_headers=["Content-Disposition"],
    )

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    limiter.init_app(app)

    @jwt.unauthorized_loader
    def _missing_token(reason):
        return jsonify({"error": "Missing or invalid Authorization header"}), 401

    @jwt.invalid_token_loader
    def _invalid_token(reason):
        return jsonify({"error": "Invalid token"}), 401

    @jwt.expired_token_loader
    def _expired_token(jwt_header, jwt_payload):
        return jsonify({"error": "Token expired"}), 401

    @limiter.request_filter
    def _health_exempt():
        from flask import request
        return request.path == "/api/health"

    from app.routes.auth import auth_bp
    from app.routes.health import health_bp
    from app.routes.jobs import jobs_bp
    from app.routes.prep import prep_bp
    from app.routes.reminders import reminders_bp
    from app.routes.resumes import resumes_bp
    app.register_blueprint(auth_bp)
    app.register_blueprint(health_bp)
    app.register_blueprint(jobs_bp)
    app.register_blueprint(prep_bp)
    app.register_blueprint(reminders_bp)
    app.register_blueprint(resumes_bp)

    @app.errorhandler(413)
    def _too_large(e):
        return jsonify({"error": "File too large. Maximum size is 5 MB."}), 413

    import os
    os.makedirs(
        os.path.join(app.config["UPLOAD_DIR"], "resumes"),
        exist_ok=True,
    )

    from app.cli import reminders_cli
    app.cli.add_command(reminders_cli)

    return app
