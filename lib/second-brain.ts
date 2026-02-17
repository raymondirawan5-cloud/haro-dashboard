import fs from "node:fs";
import path from "node:path";

export const WORKSPACE_DIR = process.env.HARO_WORKSPACE_DIR || "/home/ray/.openclaw/workspace";
export const TASKS_PATH =
  process.env.HARO_TASKS_PATH || path.join(WORKSPACE_DIR, ".openclaw", "tasks.json");

const WORKSPACE_KEY_DOCS = ["AGENTS.md", "SOUL.md", "USER.md", "TOOLS.md", "HEARTBEAT.md"];

const DEFAULT_COLUMNS = [
  { id: "backlog", title: "Backlog" },
  { id: "doing", title: "Doing" },
  { id: "waiting", title: "Waiting" },
  { id: "done", title: "Done" },
];

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

type TaskColumn = { id: string; title: string; [key: string]: unknown };
export type TaskCard = {
  id: string;
  title: string;
  columnId: string;
  details?: string;
  dueDate?: string;
  [key: string]: unknown;
};

type TasksFile = {
  columns: TaskColumn[];
  cards: TaskCard[];
  updatedAt: string | null;
  [key: string]: unknown;
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

function defaultTasksFile(): TasksFile {
  return {
    columns: DEFAULT_COLUMNS,
    cards: [],
    updatedAt: null,
  };
}

function ensureTasksDir() {
  fs.mkdirSync(path.dirname(TASKS_PATH), { recursive: true });
}

function loadTasksFile(): TasksFile {
  const raw = safeRead(TASKS_PATH);
  if (!raw) return defaultTasksFile();

  try {
    const parsed = JSON.parse(raw);
    const columns = Array.isArray(parsed.columns) ? parsed.columns : DEFAULT_COLUMNS;
    const cards = Array.isArray(parsed.cards) ? parsed.cards : [];
    return {
      ...parsed,
      columns,
      cards,
      updatedAt: parsed.updatedAt ?? null,
    };
  } catch {
    return defaultTasksFile();
  }
}

function saveTasksFile(data: TasksFile): TasksFile {
  const next = {
    ...data,
    updatedAt: new Date().toISOString(),
  };
  ensureTasksDir();
  fs.writeFileSync(TASKS_PATH, `${JSON.stringify(next, null, 2)}\n`, "utf8");
  return next;
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
  const parsed = loadTasksFile();
  return {
    columns: parsed.columns,
    cards: parsed.cards,
    updatedAt: parsed.updatedAt ?? null,
  };
}

export function createTask(input: { title: string; details?: string; status?: string }) {
  const parsed = loadTasksFile();
  const columns = parsed.columns?.length ? parsed.columns : DEFAULT_COLUMNS;
  const defaultColumnId = columns[0]?.id || "backlog";
  const requestedStatus = (input.status || "").trim();
  const columnId = columns.some((c) => c.id === requestedStatus) ? requestedStatus : defaultColumnId;

  const card: TaskCard = {
    id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: input.title.trim(),
    columnId,
  };

  if (input.details?.trim()) card.details = input.details.trim();

  parsed.cards = [...parsed.cards, card];
  const saved = saveTasksFile(parsed);
  return { card, data: { columns: saved.columns, cards: saved.cards, updatedAt: saved.updatedAt } };
}

export function updateTask(input: {
  id: string;
  title?: string;
  status?: string;
  dueDate?: string | null;
}) {
  const parsed = loadTasksFile();
  const columns = parsed.columns?.length ? parsed.columns : DEFAULT_COLUMNS;

  const idx = parsed.cards.findIndex((c) => c?.id === input.id);
  if (idx < 0) return null;

  const current = parsed.cards[idx];
  const next: TaskCard = { ...current };

  if (typeof input.title === "string" && input.title.trim()) {
    next.title = input.title.trim();
  }

  if (typeof input.status === "string" && columns.some((c) => c.id === input.status)) {
    next.columnId = input.status;
  }

  if (input.dueDate === null) {
    delete next.dueDate;
  } else if (typeof input.dueDate === "string") {
    const trimmed = input.dueDate.trim();
    if (!trimmed) delete next.dueDate;
    else next.dueDate = trimmed;
  }

  parsed.cards = [
    ...parsed.cards.slice(0, idx),
    next,
    ...parsed.cards.slice(idx + 1),
  ];

  const saved = saveTasksFile(parsed);
  return { card: next, data: { columns: saved.columns, cards: saved.cards, updatedAt: saved.updatedAt } };
}
