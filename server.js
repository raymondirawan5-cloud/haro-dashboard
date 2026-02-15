import express from "express";
import fs from "node:fs";
import path from "node:path";
import { loadTasks, newId, saveTasks } from "./tasks.js";

const app = express();

// Change these if you move things.
const WORKSPACE_DIR = process.env.HARO_WORKSPACE_DIR || "/home/ray/.openclaw/workspace";
const WORKLOG_PATH = process.env.HARO_WORKLOG_PATH || path.join(WORKSPACE_DIR, ".openclaw", "worklog.jsonl");
const TASKS_PATH = process.env.HARO_TASKS_PATH || path.join(WORKSPACE_DIR, ".openclaw", "tasks.json");

app.get("/api/health", (req, res) => res.json({ ok: true }));

function readJsonl(filePath, maxLines = 5000) {
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, "utf8");
  const lines = raw.split(/\r?\n/).filter(Boolean);
  const sliced = lines.slice(-maxLines);
  const out = [];
  for (const line of sliced) {
    try {
      out.push(JSON.parse(line));
    } catch {
      // skip malformed line
    }
  }
  return out;
}

app.get("/api/worklog", (req, res) => {
  const items = readJsonl(WORKLOG_PATH, 5000);
  res.json({ workspaceDir: WORKSPACE_DIR, worklogPath: WORKLOG_PATH, count: items.length, items });
});

app.get("/api/tasks", (req, res) => {
  const tasks = loadTasks(TASKS_PATH);
  res.json({ tasksPath: TASKS_PATH, ...tasks });
});

app.post("/api/tasks", express.json(), (req, res) => {
  const { title, details = "", project = "", columnId = "backlog", priority = 2 } = req.body || {};
  if (!title || typeof title !== "string") {
    return res.status(400).json({ ok: false, error: "title required" });
  }
  const tasks = loadTasks(TASKS_PATH);
  const card = {
    id: newId("card"),
    title,
    details,
    project,
    columnId,
    priority,
    createdAt: new Date().toISOString(),
  };
  tasks.cards = tasks.cards || [];
  tasks.cards.push(card);
  const saved = saveTasks(TASKS_PATH, tasks);
  res.json({ ok: true, card, updatedAt: saved.updatedAt });
});

app.post("/api/tasks/:id/move", express.json(), (req, res) => {
  const { id } = req.params;
  const { columnId } = req.body || {};
  const tasks = loadTasks(TASKS_PATH);
  const cards = tasks.cards || [];
  const card = cards.find((c) => c.id === id);
  if (!card) return res.status(404).json({ ok: false, error: "not found" });
  card.columnId = columnId;
  const saved = saveTasks(TASKS_PATH, tasks);
  res.json({ ok: true, card, updatedAt: saved.updatedAt });
});

app.use("/public", express.static(path.join(process.cwd(), "public")));

app.get("/", (req, res) => {
  res.type("html").send(`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Haro Mission Control</title>
  <link rel="stylesheet" href="/public/styles.css" />
</head>
<body>
  <header>
    <h1>Haro Mission Control</h1>
    <div class="muted small">Kanban (tasks.json) + Activity feed (worklog.jsonl)</div>
  </header>
  <main>
    <div class="grid">
      <section class="panel">
        <div class="panel-head">
          <div>
            <div style="font-weight:700">Tasks</div>
            <div id="tasks-meta" class="muted small"></div>
          </div>
          <button id="add-task">+ Add</button>
        </div>
        <div id="kanban"></div>
      </section>

      <aside class="panel">
        <div class="panel-head">
          <div>
            <div style="font-weight:700">Activity</div>
            <div id="worklog-meta" class="muted small"></div>
          </div>
        </div>
        <div id="worklog"></div>
      </aside>
    </div>
  </main>
  <script src="/public/app.js"></script>
</body>
</html>`);
});

const port = process.env.PORT || 8787;
app.listen(port, "127.0.0.1", () => {
  console.log(`Haro Dashboard listening on http://127.0.0.1:${port}`);
});
