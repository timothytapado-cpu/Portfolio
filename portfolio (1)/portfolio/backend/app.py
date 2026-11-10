"""BUSINESS / API LAYER: Flask contact API for the portfolio."""
import os
import re

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

import db

load_dotenv()

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 10 * 1024  # 10 KB body cap

origins = [o.strip() for o in os.getenv(
    "ALLOWED_ORIGINS", "http://localhost:5500,http://127.0.0.1:5500").split(",")]
CORS(app, origins=origins, methods=["GET", "POST", "OPTIONS"])

limiter = Limiter(get_remote_address, app=app, storage_uri="memory://")
EMAIL_RE = re.compile(r"^\S+@\S+\.\S+$")


@app.get("/api/health")
def health():
    return jsonify(status="ok")


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
        row = db.save_message(name, email, message)
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


if __name__ == "__main__":
    app.run(port=int(os.getenv("PORT", 3000)))
