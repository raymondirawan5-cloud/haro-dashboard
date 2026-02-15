async function api(path, opts) {
  const r = await fetch(path, opts);
  if (!r.ok) {
    const t = await r.text().catch(() => "");
    throw new Error(`HTTP ${r.status} ${r.statusText}: ${t}`);
  }
  return r.json();
}

function el(tag, attrs = {}, children = []) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") n.className = v;
    else if (k.startsWith("on") && typeof v === "function") n.addEventListener(k.slice(2), v);
    else n.setAttribute(k, v);
  }
  for (const c of children) n.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  return n;
}

function fmtTs(ts) {
  try { return new Date(ts).toLocaleString(); } catch { return ts; }
}

function badge(type) {
  const m = {
    note: "badge badge-note",
    pr: "badge badge-pr",
    error: "badge badge-err",
  };
  return m[type] || "badge";
}

async function renderWorklog() {
  const out = document.getElementById("worklog");
  out.textContent = "Loading…";
  try {
    const j = await api("/api/worklog");
    document.getElementById("worklog-meta").textContent = `items: ${j.count} | source: ${j.worklogPath}`;

    const items = (j.items || []).slice(-80).reverse();
    out.innerHTML = "";
    for (const it of items) {
      const row = el("div", { class: "log-row" }, [
        el("div", { class: "log-left" }, [
          el("div", { class: badge(it.type) }, [it.type || "event"]),
          el("div", { class: "log-title" }, [it.title || "(no title)"]),
        ]),
        el("div", { class: "log-right muted" }, [fmtTs(it.ts)]),
      ]);
      const det = it.details ? el("div", { class: "log-details" }, [it.details]) : null;
      const wrap = el("div", { class: "log-item" }, det ? [row, det] : [row]);
      out.appendChild(wrap);
    }
  } catch (e) {
    out.textContent = `Failed to load worklog: ${e.message}`;
  }
}

function cardEl(card, onMove) {
  const proj = card.project ? ` · ${card.project}` : "";
  const pri = card.priority ? `P${card.priority}` : "";
  const meta = [pri, proj].filter(Boolean).join(" ");
  return el("div", { class: "card", draggable: "true" }, [
    el("div", { class: "card-title" }, [card.title]),
    meta ? el("div", { class: "muted small" }, [meta]) : el("div"),
  ]);
}

async function renderKanban() {
  const root = document.getElementById("kanban");
  root.innerHTML = "";

  const data = await api("/api/tasks");

  const cols = data.columns || [];
  const cards = data.cards || [];

  const byCol = {};
  for (const c of cols) byCol[c.id] = [];
  for (const card of cards) {
    (byCol[card.columnId] ||= []).push(card);
  }

  // Basic drag/drop by updating columnId
  let draggingId = null;

  function colView(col) {
    const body = el("div", { class: "col-body" }, []);

    body.addEventListener("dragover", (e) => {
      e.preventDefault();
      body.classList.add("dragover");
    });
    body.addEventListener("dragleave", () => body.classList.remove("dragover"));
    body.addEventListener("drop", async (e) => {
      e.preventDefault();
      body.classList.remove("dragover");
      if (!draggingId) return;
      await api(`/api/tasks/${draggingId}/move`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ columnId: col.id }),
      });
      draggingId = null;
      await renderKanban();
    });

    for (const card of byCol[col.id] || []) {
      const c = cardEl(card);
      c.addEventListener("dragstart", () => {
        draggingId = card.id;
      });
      body.appendChild(c);
    }

    return el("div", { class: "col" }, [
      el("div", { class: "col-head" }, [
        el("div", {}, [col.title]),
        el("div", { class: "muted small" }, [`${(byCol[col.id] || []).length}`]),
      ]),
      body,
    ]);
  }

  const board = el("div", { class: "board" }, cols.map(colView));
  root.appendChild(board);

  // Add card
  document.getElementById("add-task").onclick = async () => {
    const title = prompt("Task title?");
    if (!title) return;
    const project = prompt("Project? (vyxen/padel/invest/infra)") || "";
    await api("/api/tasks", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title, project, columnId: "backlog", priority: 2 }),
    });
    await renderKanban();
  };

  document.getElementById("tasks-meta").textContent = `Updated: ${fmtTs(data.updatedAt)}`;
}

async function init() {
  await Promise.all([renderWorklog(), renderKanban()]);
  // refresh worklog every 60s
  setInterval(renderWorklog, 60000);
}

init().catch((e) => {
  document.getElementById("worklog").textContent = String(e);
});
