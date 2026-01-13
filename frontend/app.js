import RFB from "/static/novnc/core/rfb.js";

const tabBar = document.getElementById("tabBar");
const viewport = document.getElementById("viewport");
const statusBar = document.getElementById("statusBar");

const tabs = {};
let currentSession = null;

async function loadConnections() {
  const res = await fetch("/connections");
  const conns = await res.json();

  for (const c of conns) {
    createTab(c);
  }
}

async function openTab(conn) {
  if (currentSession?.connId === conn.id) return;

  if (currentSession) {
    try {
      currentSession.rfb.disconnect();
    } catch {}
    await fetch(`/disconnect/${currentSession.connId}`, { method: "POST" });
    currentSession = null;
  }

  viewport.innerHTML = "";
  statusBar.textContent = "🟡 Connecting...";

  const res = await fetch(`/connect/${conn.id}`, { method: "POST" });
  const { ws_port } = await res.json();

  const screen = document.createElement("div");
  screen.style.width = "100%";
  screen.style.height = "100%";
  viewport.appendChild(screen);

  const rfb = new RFB(screen, `ws://localhost:${ws_port}`, {
    credentials: { password: conn.password },
  });

  rfb.scaleViewport = true;
  rfb.resizeSession = true;

  rfb.addEventListener("connect", () => {
    statusBar.textContent = "🟢 Connected";
  });

  rfb.addEventListener("disconnect", () => {
    statusBar.textContent = "🔴 Disconnected";
  });

  setActiveTab(conn.id);
  currentSession = { connId: conn.id, rfb };
}

function createTab(conn) {
  if (tabs[conn.id]) return;

  const tab = document.createElement("div");
  tab.className = "tab";
  tab.textContent = conn.name;

  tab.onclick = () => openTab(conn);

  const closeBtn = document.createElement("button");
  closeBtn.textContent = "✖";

  closeBtn.onclick = async (e) => {
    e.stopPropagation();

    if (currentSession?.connId === conn.id) {
      try {
        currentSession.rfb.disconnect();
      } catch {}
      await fetch(`/disconnect/${conn.id}`, { method: "POST" });
      viewport.innerHTML = "";
      statusBar.textContent = "";
      currentSession = null;
    }

    tab.remove();
    delete tabs[conn.id];
  };

  tab.appendChild(closeBtn);
  tabBar.appendChild(tab);
  tabs[conn.id] = tab;
}

function setActiveTab(connId) {
  for (const id in tabs) {
    tabs[id].classList.toggle("active", id === connId);
  }
}

document.getElementById("connForm").onsubmit = async (e) => {
  e.preventDefault();

  const data = {
    name: document.getElementById("name").value,
    host: document.getElementById("host").value,
    port: parseInt(document.getElementById("port").value),
    password: document.getElementById("password").value || null,
  };

  const res = await fetch("/connections", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json();
    alert(err.detail || "Failed to save connection");
    return;
  }

  e.target.reset();
  loadConnections();
};

loadConnections();

window.addEventListener("beforeunload", () => {
  for (const connId in activeTabs) {
    try {
      activeTabs[connId].rfb.disconnect();
    } catch {}

    navigator.sendBeacon(`/disconnect/${connId}`, "");
  }
});
