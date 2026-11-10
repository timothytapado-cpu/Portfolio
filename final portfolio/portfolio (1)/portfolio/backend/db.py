"""DATA LAYER: isolated behind a tiny repository interface.
Swap this file for SQLite/PostgreSQL/MongoDB without touching app.py."""
import json
import threading
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path

FILE = Path(__file__).parent / "data" / "messages.json"
_lock = threading.Lock()


def read_all():
    try:
        return json.loads(FILE.read_text(encoding="utf-8"))
    except FileNotFoundError:
        return []


def save_message(name: str, email: str, message: str) -> dict:
    row = {
        "id": uuid.uuid4().hex[:10],
        "name": name,
        "email": email,
        "message": message,
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }
    with _lock:
        FILE.parent.mkdir(parents=True, exist_ok=True)
        rows = read_all()
        rows.append(row)
        FILE.write_text(json.dumps(rows, indent=2), encoding="utf-8")
    return row
