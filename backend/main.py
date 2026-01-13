import os

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from backend import proxy, storage

app = FastAPI()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")

app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")


@app.get("/")
def index():
    return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))


class Conn(BaseModel):
    name: str
    host: str
    port: int
    password: str | None = None


@app.get("/connections")
def list_connections():
    return storage.load()


@app.post("/connections")
def create_connection(c: Conn):
    try:
        return storage.add(c.dict())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/connect/{conn_id}")
def connect(conn_id: str):
    conns = storage.load()
    conn = next(c for c in conns if c["id"] == conn_id)
    ws_port = proxy.start_proxy(conn)
    return {"ws_port": ws_port}


@app.post("/disconnect/{conn_id}")
def disconnect(conn_id: str):
    proxy.stop_proxy(conn_id)
    return {"status": "stopped"}
