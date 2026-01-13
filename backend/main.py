import proxy
import storage
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()


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
    return storage.add(c.dict())


@app.post("/connect/{conn_id}")
def connect(conn_id: str):
    conns = storage.load()
    conn = next(c for c in conns if c["id"] == conn_id)
    ws_port = proxy.start_proxy(conn)
    return {"ws_port": ws_port}
