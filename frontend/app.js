import RFB from "/static/novnc/core/rfb.js";

const tabBar = document.getElementById("tabBar");
const viewport = document.getElementById("viewport");
const statusBar = document.getElementById("statusBar");

const modalBackdrop = document.getElementById("modalBackdrop");
const openModalBtn = document.getElementById("openModalBtn");
const closeModalBtn = document.getElementById("closeModalBtn");

openModalBtn.onclick = () => {
  modalBackdrop.classList.remove("hidden");
};

closeModalBtn.onclick = () => {
  modalBackdrop.classList.add("hidden");
};

modalBackdrop.onclick = (e) => {
  if (e.target === modalBackdrop) {
    modalBackdrop.classList.add("hidden");
  }
};

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
    "px-3 py-1 bg-gray-600 rounded cursor-pointer flex items-center gap-3 text-sm";

  // --- Text container ---
  const textWrap = document.createElement("div");
  textWrap.className = "flex flex-col leading-tight";

  const nameEl = document.createElement("span");
  nameEl.textContent = conn.name;
  nameEl.className = "font-medium text-white";

  const ipEl = document.createElement("span");
  ipEl.textContent = `${conn.host}:${conn.port}`;
  ipEl.className = "text-xs text-gray-300";

  textWrap.appendChild(nameEl);
  textWrap.appendChild(ipEl);

  // --- Close button ---
  const close = document.createElement("span");
  close.textContent = "✖";
  close.className = "ml-2 text-red-400 hover:text-red-600 cursor-pointer";

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

  tab.appendChild(textWrap);
  tab.appendChild(close);

  tab.onclick = () => openTab(conn);

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
  modalBackdrop.classList.add("hidden");
};

loadConnections();
