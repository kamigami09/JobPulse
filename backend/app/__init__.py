from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


def create_app():
    app = Flask(__name__)

    # Load config
    app.config.from_object("app.config.Config")

    # Enable CORS for frontend
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

    # Initialize database
    db.init_app(app)

    # Register blueprints
    from app.routes.health import health_bp
    from app.routes.jobs import jobs_bp
    from app.routes.settings import settings_bp
    app.register_blueprint(health_bp)
    app.register_blueprint(jobs_bp)
    app.register_blueprint(settings_bp)

    # Create tables on first request
    with app.app_context():
        from app import models  # noqa: F401
        db.create_all()

    return app
