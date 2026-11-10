"""Flask application serving the portfolio and its JSON APIs."""
import os
import re
from pathlib import Path

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from sqlalchemy.exc import SQLAlchemyError

import db as contact_store
from models import Project, db

BACKEND_DIR = Path(__file__).resolve().parent
PORTFOLIO_ROOT = BACKEND_DIR.parent
load_dotenv(BACKEND_DIR / ".env")

PROJECT_CATEGORIES = {"Academic", "Personal", "Other"}
PROJECT_STATUSES = {"Not Started", "In Progress", "Completed"}


EMAIL_RE = re.compile(r"^\S+@\S+\.\S+$")


def create_app(test_config=None):
    database_path = BACKEND_DIR / "data" / "projects.sqlite3"
    database_path.parent.mkdir(parents=True, exist_ok=True)

    app = Flask(
        __name__,
        static_folder=str(PORTFOLIO_ROOT),
        static_url_path="",
    )
    app.config.from_mapping(
        MAX_CONTENT_LENGTH=10 * 1024,
        SQLALCHEMY_DATABASE_URI=os.getenv(
            "DATABASE_URL", f"sqlite:///{database_path.as_posix()}"
        ),
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
    )
    if test_config:
        app.config.update(test_config)

    origins = [
        origin.strip()
        for origin in os.getenv(
            "ALLOWED_ORIGINS",
            "http://localhost:5500,http://127.0.0.1:5500",
        ).split(",")
        if origin.strip()
    ]
    CORS(
        app,
        origins=origins,
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    )
    limiter = Limiter(key_func=get_remote_address, app=app, storage_uri="memory://")
    db.init_app(app)

    with app.app_context():
        db.create_all()

    @app.get("/")
    def portfolio():
        return app.send_static_file("index.html")

    def validate_project(data):
        if not isinstance(data, dict):
            return None, "A JSON object is required."

        title = data.get("title")
        description = data.get("description")
        category = data.get("category")
        status = data.get("status")

        if not isinstance(title, str) or not title.strip() or len(title.strip()) > 120:
            return None, "Title is required and must be 120 characters or fewer."
        if (
            not isinstance(description, str)
            or not description.strip()
            or len(description.strip()) > 2000
        ):
            return None, "Description is required and must be 2000 characters or fewer."
        if not isinstance(category, str) or category not in PROJECT_CATEGORIES:
            return None, "Choose Academic, Personal, or Other as the category."
        if not isinstance(status, str) or status not in PROJECT_STATUSES:
            return None, "Choose Not Started, In Progress, or Completed as the status."

        return {
            "title": title.strip(),
            "description": description.strip(),
            "category": category,
            "status": status,
        }, None


    @app.get("/api/health")
    def health():
        return jsonify(status="ok")


    @app.get("/api/projects")
    def list_projects():
        try:
            projects = Project.query.order_by(
                Project.date_created.desc(), Project.id.desc()
            ).all()
            return jsonify(projects=[project.to_dict() for project in projects])
        except SQLAlchemyError:
            app.logger.exception("Could not retrieve projects")
            return jsonify(error="Could not load projects. Please try again later."), 500

    @app.post("/api/projects")
    def create_project():
        data = request.get_json(silent=True)
        project_data, error = validate_project(data)
        if error:
            return jsonify(error=error), 400

        project = Project(**project_data)
        try:
            db.session.add(project)
            db.session.commit()
        except SQLAlchemyError:
            db.session.rollback()
            app.logger.exception("Could not create project")
            return jsonify(error="Could not save the project. Please try again later."), 500
        return jsonify(project=project.to_dict()), 201

    @app.get("/api/projects/<int:project_id>")
    def get_project(project_id):
        try:
            project = db.session.get(Project, project_id)
        except SQLAlchemyError:
            db.session.rollback()
            app.logger.exception("Could not retrieve project %s", project_id)
            return jsonify(error="Could not load the project. Please try again later."), 500
        if project is None:
            return jsonify(error="Project not found."), 404
        return jsonify(project=project.to_dict())

    @app.put("/api/projects/<int:project_id>")
    def update_project(project_id):
        try:
            project = db.session.get(Project, project_id)
        except SQLAlchemyError:
            db.session.rollback()
            app.logger.exception("Could not retrieve project %s for update", project_id)
            return jsonify(error="Could not load the project. Please try again later."), 500
        if project is None:
            return jsonify(error="Project not found."), 404

        data = request.get_json(silent=True)
        project_data, error = validate_project(data)
        if error:
            return jsonify(error=error), 400

        for field, value in project_data.items():
            setattr(project, field, value)
        try:
            db.session.commit()
        except SQLAlchemyError:
            db.session.rollback()
            app.logger.exception("Could not update project %s", project_id)
            return jsonify(error="Could not update the project. Please try again later."), 500
        return jsonify(project=project.to_dict())

    @app.delete("/api/projects/<int:project_id>")
    def delete_project(project_id):
        try:
            project = db.session.get(Project, project_id)
        except SQLAlchemyError:
            db.session.rollback()
            app.logger.exception("Could not retrieve project %s for deletion", project_id)
            return jsonify(error="Could not load the project. Please try again later."), 500
        if project is None:
            return jsonify(error="Project not found."), 404

        try:
            db.session.delete(project)
            db.session.commit()
        except SQLAlchemyError:
            db.session.rollback()
            app.logger.exception("Could not delete project %s", project_id)
            return jsonify(error="Could not delete the project. Please try again later."), 500
        return jsonify(ok=True)

    @app.post("/api/contact")
    @limiter.limit("5 per 15 minutes")
    def contact():
        data = request.get_json(silent=True) or {}
        if data.get("website"):  # honeypot: silently drop bots
            return jsonify(ok=True)

        name = str(data.get("name", "")).strip()
        email = str(data.get("email", "")).strip()
        message = str(data.get("message", "")).strip()

        if not name or len(name) > 80:
            return jsonify(error="Please provide a valid name."), 400
        if not EMAIL_RE.match(email) or len(email) > 120:
            return jsonify(error="Please provide a valid email."), 400
        if not 10 <= len(message) <= 1000:
            return jsonify(error="Message must be 10-1000 characters."), 400

        try:
            row = contact_store.save_message(name, email, message)
        except OSError:
            app.logger.exception("Could not save message")
            return jsonify(error="Server error. Please try again later."), 500
        return jsonify(ok=True, id=row["id"]), 201

    @app.errorhandler(429)
    def too_many(_e):
        return jsonify(error="Too many messages. Please try again later."), 429


    @app.errorhandler(404)
    def not_found(_e):
        return jsonify(error="Not found"), 404

    @app.errorhandler(413)
    def too_large(_e):
        return jsonify(error="Request too large."), 413

    return app


app = create_app()


if __name__ == "__main__":
    app.run(port=int(os.getenv("PORT", 3000)))
