import RFB from "/static/novnc/core/rfb.js";

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
  const res = await fetch(`/connect/${conn.id}`, { method: "POST" });
  const { ws_port } = await res.json();

  const wrapper = document.createElement("div");
  wrapper.style.border = "1px solid #333";
  wrapper.style.margin = "10px";
  wrapper.style.display = "inline-block";

  const screen = document.createElement("div");
  screen.style.width = "800px";
  screen.style.height = "600px";

  wrapper.appendChild(screen);
  tabs.appendChild(wrapper);

  const rfb = new RFB(screen, `ws://localhost:${ws_port}`, {
    credentials: { password: conn.password },
  });

  rfb.scaleViewport = true;
  rfb.resizeSession = true;
}

document.getElementById("connForm").onsubmit = async (e) => {
  e.preventDefault();

  const data = {
    name: document.getElementById("name").value,
    host: document.getElementById("host").value,
    port: parseInt(document.getElementById("port").value),
    password: document.getElementById("password").value || null,
  };

  await fetch("/connections", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  e.target.reset();
  loadConnections();
};

loadConnections();
