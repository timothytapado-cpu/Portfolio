"""SQLAlchemy models for the project and activity manager."""
from datetime import datetime, timezone

from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class Project(db.Model):
    __tablename__ = "projects"
    __table_args__ = (
        db.CheckConstraint(
            "category IN ('Academic', 'Personal', 'Other')",
            name="valid_project_category",
        ),
        db.CheckConstraint(
            "status IN ('Not Started', 'In Progress', 'Completed')",
            name="valid_project_status",
        ),
    )

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(120), nullable=False)
    description = db.Column(db.String(2000), nullable=False)
    category = db.Column(db.String(20), nullable=False)
    status = db.Column(db.String(20), nullable=False)
    date_created = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "category": self.category,
            "status": self.status,
            "dateCreated": self.date_created.isoformat(),
        }
