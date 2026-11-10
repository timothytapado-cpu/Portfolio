import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from app import create_app
from models import db


class ProjectManagerApiTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        database_path = Path(self.temp_dir.name, "projects.sqlite3").as_posix()
        self.app = create_app({
            "TESTING": True,
            "SQLALCHEMY_DATABASE_URI": f"sqlite:///{database_path}",
        })
        self.apps = [self.app]
        self.client = self.app.test_client()

    def tearDown(self):
        for app in self.apps:
            with app.app_context():
                db.engine.dispose()
        self.temp_dir.cleanup()

    def create_record(self):
        response = self.client.post("/api/projects", json={
            "title": "Database Portfolio",
            "description": "Build an ORM-backed portfolio manager.",
            "category": "Academic",
            "status": "In Progress",
        })
        self.assertEqual(response.status_code, 201)
        return response.json["project"]

    def test_create_list_and_get_project(self):
        project = self.create_record()

        listing = self.client.get("/api/projects")
        self.assertEqual(listing.status_code, 200)
        self.assertEqual(listing.json["projects"][0]["id"], project["id"])
        self.assertTrue(listing.json["projects"][0]["dateCreated"])

        detail = self.client.get(f"/api/projects/{project['id']}")
        self.assertEqual(detail.status_code, 200)
        self.assertEqual(detail.json["project"]["title"], "Database Portfolio")

    def test_update_project(self):
        project = self.create_record()

        response = self.client.put(f"/api/projects/{project['id']}", json={
            "title": "Updated Portfolio",
            "description": "Updated description.",
            "category": "Personal",
            "status": "Completed",
        })

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json["project"]["title"], "Updated Portfolio")
        self.assertEqual(response.json["project"]["category"], "Personal")
        self.assertEqual(response.json["project"]["status"], "Completed")

    def test_delete_project(self):
        project = self.create_record()

        response = self.client.delete(f"/api/projects/{project['id']}")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.client.get("/api/projects").json["projects"], [])
        self.assertEqual(self.client.get(f"/api/projects/{project['id']}").status_code, 404)

    def test_validation_and_missing_record(self):
        invalid = self.client.post("/api/projects", json={
            "title": " ",
            "description": "Missing required fields",
            "category": "Invalid",
            "status": "In Progress",
        })
        self.assertEqual(invalid.status_code, 400)
        self.assertIn("error", invalid.json)
        self.assertEqual(self.client.put("/api/projects/999", json={}).status_code, 404)

    def test_records_persist_when_app_restarts(self):
        project = self.create_record()
        database_uri = self.app.config["SQLALCHEMY_DATABASE_URI"]
        restarted_app = create_app({
            "TESTING": True,
            "SQLALCHEMY_DATABASE_URI": database_uri,
        })
        self.apps.append(restarted_app)

        response = restarted_app.test_client().get("/api/projects")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json["projects"][0]["id"], project["id"])

    def test_portfolio_and_existing_contact_api_remain_available(self):
        page = self.client.get("/")
        self.assertEqual(page.status_code, 200)
        self.assertIn(b"My Projects &amp; Activities", page.data)
        page.close()
        self.assertEqual(self.client.get("/api/health").json["status"], "ok")

        with patch("app.contact_store.save_message", return_value={"id": "test-id"}):
            contact = self.client.post("/api/contact", json={
                "name": "Portfolio Visitor",
                "email": "visitor@example.com",
                "message": "I would like to discuss a project.",
            })
        self.assertEqual(contact.status_code, 201)


if __name__ == "__main__":
    unittest.main()
