import RFB from "/static/novnc/core/rfb.js";

async function loadConnections() {
  const res = await fetch("/connections");
  const conns = await res.json();

  const list = document.getElementById("list");
  list.innerHTML = "";

  for (const c of conns) {
    const li = document.createElement("li");
    li.textContent = c.name;
    li.onclick = () => openTab(c);
    list.appendChild(li);
  }
}

async function openTab(conn) {
  const res = await fetch(`/connect/${conn.id}`, { method: "POST" });
  const { ws_port } = await res.json();

  const screen = document.createElement("div");
  screen.style.width = "800px";
  screen.style.height = "600px";
  document.getElementById("tabs").appendChild(screen);

  const rfb = new RFB(screen, `ws://localhost:${ws_port}`, {
    credentials: { password: conn.password },
  });

  rfb.scaleViewport = true;
}

loadConnections();
