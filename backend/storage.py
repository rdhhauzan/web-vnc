import json
import os
import uuid

FILE = "backend/connections.json"


def load():
    if not os.path.exists(FILE):
        return []
    with open(FILE) as f:
        return json.load(f)


def save(data):
    with open(FILE, "w") as f:
        json.dump(data, f, indent=2)


def add(conn):
    data = load()
    conn["id"] = str(uuid.uuid4())
    data.append(conn)
    save(data)
    return conn
