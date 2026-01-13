import random
import subprocess

proxies = {}


def start_proxy(conn):
    ws_port = random.randint(20000, 30000)

    proc = subprocess.Popen(
        ["websockify", str(ws_port), f"{conn['host']}:{conn['port']}"]
    )

    proxies[conn["id"]] = {"port": ws_port, "proc": proc}

    return ws_port
