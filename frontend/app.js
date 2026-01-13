import RFB from "/static/novnc/core/rfb.js";

const activeTabs = {};

const list = document.getElementById("list");
const tabs = document.getElementById("tabs");

async function loadConnections() {
  const res = await fetch("/connections");
  const conns = await res.json();

  list.innerHTML = "";

  for (const c of conns) {
    const li = document.createElement("li");
    li.textContent = `${c.name} (${c.host}:${c.port})`;
    li.onclick = () => openTab(c);
    list.appendChild(li);
  }
}

async function openTab(conn) {
  if (activeTabs[conn.id]) {
    activeTabs[conn.id].wrapper.scrollIntoView({ behavior: "smooth" });
    return;
  }

  const res = await fetch(`/connect/${conn.id}`, { method: "POST" });
  const { ws_port } = await res.json();

  const wrapper = document.createElement("div");
  wrapper.style.border = "1px solid #333";
  wrapper.style.margin = "10px";
  wrapper.style.display = "inline-block";

  const header = document.createElement("div");
  header.style.background = "#222";
  header.style.color = "#fff";
  header.style.padding = "4px";
  header.style.display = "flex";
  header.style.justifyContent = "space-between";
  header.textContent = conn.name;

  const closeBtn = document.createElement("button");
  closeBtn.textContent = "✖";
  closeBtn.style.cursor = "pointer";

  header.appendChild(closeBtn);

  const screen = document.createElement("div");
  screen.style.width = "800px";
  screen.style.height = "600px";

  wrapper.appendChild(header);
  wrapper.appendChild(screen);
  tabs.appendChild(wrapper);

  const rfb = new RFB(screen, `ws://localhost:${ws_port}`, {
    credentials: { password: conn.password },
  });

  rfb.scaleViewport = true;
  rfb.resizeSession = true;

  activeTabs[conn.id] = { wrapper, rfb };

  closeBtn.onclick = async () => {
    try {
      rfb.disconnect();
    } catch {}
    await fetch(`/disconnect/${conn.id}`, { method: "POST" });
    wrapper.remove();
    delete activeTabs[conn.id];
  };
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
