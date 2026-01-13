import RFB from "/static/novnc/core/rfb.js";

const tabBar = document.getElementById("tabBar");
const viewport = document.getElementById("viewport");
const statusBar = document.getElementById("statusBar");

const tabs = {};
let currentSession = null;

async function openTab(conn) {
  if (currentSession?.connId === conn.id) return;

  // Close previous
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
  screen.className = "w-full h-full";
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
  tab.className =
    "px-3 py-1 bg-gray-600 rounded cursor-pointer flex items-center gap-2";
  tab.textContent = conn.name;

  tab.onclick = () => openTab(conn);

  const close = document.createElement("span");
  close.textContent = "✖";
  close.className = "text-red-400 hover:text-red-600";
  close.onclick = async (e) => {
    e.stopPropagation();

    if (currentSession?.connId === conn.id) {
      try {
        currentSession.rfb.disconnect();
      } catch {}
      await fetch(`/disconnect/${conn.id}`, { method: "POST" });
      viewport.innerHTML = "";
      statusBar.textContent = "No active session";
      currentSession = null;
    }

    tab.remove();
    delete tabs[conn.id];
  };

  tab.appendChild(close);
  tabBar.appendChild(tab);
  tabs[conn.id] = tab;
}

function setActiveTab(connId) {
  Object.entries(tabs).forEach(([id, tab]) => {
    tab.classList.toggle("bg-blue-600", id === connId);
    tab.classList.toggle("bg-gray-600", id !== connId);
  });
}

async function loadConnections() {
  const res = await fetch("/connections");
  const conns = await res.json();

  for (const c of conns) {
    createTab(c);
  }

  // 🔥 AUTO OPEN FIRST TAB
  if (conns.length > 0) {
    openTab(conns[0]);
  }
}

document.getElementById("connForm").onsubmit = async (e) => {
  e.preventDefault();

  const data = {
    name: connName.value,
    host: host.value,
    port: parseInt(port.value),
    password: password.value || null,
  };

  const res = await fetch("/connections", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    alert((await res.json()).detail);
    return;
  }

  const conn = await res.json();
  createTab(conn);
  openTab(conn);
  e.target.reset();
};

loadConnections();
