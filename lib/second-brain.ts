import fs from "node:fs";
import path from "node:path";

export const WORKSPACE_DIR = process.env.HARO_WORKSPACE_DIR || "/home/ray/.openclaw/workspace";
export const TASKS_PATH =
  process.env.HARO_TASKS_PATH || path.join(WORKSPACE_DIR, ".openclaw", "tasks.json");

const WORKSPACE_KEY_DOCS = ["AGENTS.md", "SOUL.md", "USER.md", "TOOLS.md", "HEARTBEAT.md"];

export type DocItem = {
  id: string;
  title: string;
  path: string;
  source: "workspace" | "repo";
  preview: string;
};

export type MemoryItem = {
  id: string;
  title: string;
  path: string;
  preview: string;
};

function safeRead(filePath: string): string | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    const stat = fs.statSync(filePath);
    if (!stat.isFile()) return null;
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return null;
  }
}

function preview(text: string, max = 280): string {
  return text.replace(/\s+/g, " ").trim().slice(0, max);
}

export function listMemories(): MemoryItem[] {
  const items: MemoryItem[] = [];
  const longTerm = path.join(WORKSPACE_DIR, "MEMORY.md");
  const longContent = safeRead(longTerm);
  if (longContent) {
    items.push({
      id: "memory-root",
      title: "MEMORY.md",
      path: longTerm,
      preview: preview(longContent),
    });
  }

  const memDir = path.join(WORKSPACE_DIR, "memory");
  if (fs.existsSync(memDir) && fs.statSync(memDir).isDirectory()) {
    const files = fs
      .readdirSync(memDir)
      .filter((name) => name.endsWith(".md"))
      .sort((a, b) => b.localeCompare(a));

    for (const name of files) {
      const filePath = path.join(memDir, name);
      const content = safeRead(filePath);
      if (!content) continue;
      items.push({
        id: `mem-${name}`,
        title: name,
        path: filePath,
        preview: preview(content),
      });
    }
  }

  return items;
}

export function listDocuments(repoDir: string): DocItem[] {
  const out: DocItem[] = [];

  for (const name of WORKSPACE_KEY_DOCS) {
    const p = path.join(WORKSPACE_DIR, name);
    const content = safeRead(p);
    if (!content) continue;
    out.push({
      id: `workspace-${name}`,
      title: name,
      path: p,
      source: "workspace",
      preview: preview(content),
    });
  }

  const repoDocs = fs
    .readdirSync(repoDir)
    .filter((name) => name.toLowerCase().endsWith(".md"))
    .sort((a, b) => a.localeCompare(b));

  for (const name of repoDocs) {
    const p = path.join(repoDir, name);
    const content = safeRead(p);
    if (!content) continue;
    out.push({
      id: `repo-${name}`,
      title: name,
      path: p,
      source: "repo",
      preview: preview(content),
    });
  }

  return out;
}

export function readTasksRaw() {
  const raw = safeRead(TASKS_PATH);
  if (!raw) {
    return {
      columns: [
        { id: "backlog", title: "Backlog" },
        { id: "doing", title: "Doing" },
        { id: "waiting", title: "Waiting" },
        { id: "done", title: "Done" },
      ],
      cards: [],
      updatedAt: null,
    };
  }

  try {
    const parsed = JSON.parse(raw);
    return {
      columns: Array.isArray(parsed.columns) ? parsed.columns : [],
      cards: Array.isArray(parsed.cards) ? parsed.cards : [],
      updatedAt: parsed.updatedAt ?? null,
    };
  } catch {
    return { columns: [], cards: [], updatedAt: null };
  }
}
