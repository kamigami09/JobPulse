from flask import Flask
from flask_cors import CORS
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()
migrate = Migrate()


def create_app():
    app = Flask(__name__)
    app.config.from_object("app.config.Config")

    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

    db.init_app(app)
    migrate.init_app(app, db)

    from app.routes.health import health_bp
    from app.routes.jobs import jobs_bp
    app.register_blueprint(health_bp)
    app.register_blueprint(jobs_bp)

    return app
