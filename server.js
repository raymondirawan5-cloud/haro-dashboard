import express from "express";
import fs from "node:fs";
import path from "node:path";

const app = express();

// Change these if you move things.
const WORKSPACE_DIR = process.env.HARO_WORKSPACE_DIR || "/home/ray/.openclaw/workspace";
const WORKLOG_PATH = process.env.HARO_WORKLOG_PATH || path.join(WORKSPACE_DIR, ".openclaw", "worklog.jsonl");

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

app.get("/", (req, res) => {
  res.type("html").send(`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Haro Dashboard</title>
  <style>
    body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; margin: 24px; max-width: 960px; }
    .muted { color: #666; }
    pre { background: #0b1020; color: #d7e0ff; padding: 12px; border-radius: 8px; overflow:auto; }
    .card { border: 1px solid #ddd; border-radius: 10px; padding: 16px; margin: 12px 0; }
  </style>
</head>
<body>
  <h1>Haro Dashboard</h1>
  <p class="muted">MVP: reads <code>.openclaw/worklog.jsonl</code> from your Haro workspace and renders it.</p>

  <div class="card">
    <h2>Worklog (latest)</h2>
    <div id="meta" class="muted"></div>
    <pre id="out">Loading…</pre>
  </div>

  <script>
    async function main() {
      const r = await fetch('/api/worklog');
      const j = await r.json();
      document.getElementById('meta').textContent = 'items: ' + j.count + ' | source: ' + j.worklogPath;
      const items = (j.items || []).slice(-50).reverse();
      document.getElementById('out').textContent = items.map(x => JSON.stringify(x, null, 2)).join('\n\n');
    }
    main().catch(err => {
      document.getElementById('out').textContent = String(err);
    });
  </script>
</body>
</html>`);
});

const port = process.env.PORT || 8787;
app.listen(port, "127.0.0.1", () => {
  console.log(`Haro Dashboard listening on http://127.0.0.1:${port}`);
});
