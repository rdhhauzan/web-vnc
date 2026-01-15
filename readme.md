# Web VNC (Single-User, Browser-Based)

A lightweight **browser-based VNC manager** built with **FastAPI + noVNC**.

Features:

* Web-based VNC viewer (no client install)
* Browser-style tabs (one active VNC at a time)
* Saved connections (JSON)
* Modal-based connection management
* Auto cleanup of VNC proxies
* Status indicator (connecting / connected / disconnected)
* Works locally, deployable later

---


## Requirements

* **Python 3.10+** (tested on Python 3.13)
* **Git** (for cloning noVNC)
* **VNC server** (e.g. TigerVNC, RealVNC, TightVNC)

---

## Installation

### Clone this repository

```bash
git clone https://github.com/rdhhauzan/web-vnc.git
cd web-vnc
```

---

### Install Python dependencies

```bash
pip install -r backend/requirements.txt
```

---

### Install noVNC

From the project root:

```bash
cd frontend
git clone https://github.com/novnc/noVNC.git novnc
cd ..
```

Make sure this file exists:

```
frontend/novnc/core/rfb.js
```

---

### Initialize connections storage

Ensure this file exists:

```
backend/connections.json
```

With **exact content**:

```json
[]
```

Must be a JSON array, not an object.

---

## Run the Application

From the project root:

```bash
uvicorn backend.main:app --reload
```

You should see:

```
Uvicorn running on http://127.0.0.1:8000
```

---

## Open in Browser

Open:

```
http://127.0.0.1:8000/
```

---

## How to Use

1. Click **+ Add Connection**
2. Enter:

   * Name
   * Host (IP or hostname)
   * Port (default: 5900)
   * Password (optional)
3. Save → tab is created
4. Click a tab to connect
5. Switch tabs to change VNC sessions
6. Close tab to disconnect and cleanup