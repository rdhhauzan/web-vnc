import random
import signal
import subprocess

proxies = {}


def start_proxy(conn):
    if conn["id"] in proxies:
        return proxies[conn["id"]]["port"]

    ws_port = random.randint(20000, 30000)

    proc = subprocess.Popen(
        ["websockify", str(ws_port), f"{conn['host']}:{conn['port']}"]
    )

    proxies[conn["id"]] = {"port": ws_port, "proc": proc}

    return ws_port


def stop_proxy(conn_id):
    info = proxies.get(conn_id)
    if not info:
        return

    proc = info["proc"]

    try:
        proc.terminate()
    except Exception:
        pass

    proxies.pop(conn_id, None)
