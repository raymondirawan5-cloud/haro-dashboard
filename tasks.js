import fs from "node:fs";
import path from "node:path";

export function loadTasks(tasksPath) {
  if (!fs.existsSync(tasksPath)) {
    return {
      version: 1,
      updatedAt: new Date().toISOString(),
      columns: [
        { id: "backlog", title: "Backlog" },
        { id: "doing", title: "Doing" },
        { id: "waiting", title: "Waiting on Ray" },
        { id: "done", title: "Done" },
      ],
      cards: [],
    };
  }
  const raw = fs.readFileSync(tasksPath, "utf8");
  return JSON.parse(raw);
}

export function saveTasks(tasksPath, tasks) {
  fs.mkdirSync(path.dirname(tasksPath), { recursive: true });
  const next = {
    ...tasks,
    version: tasks.version || 1,
    updatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(tasksPath, JSON.stringify(next, null, 2) + "\n", "utf8");
  return next;
}

export function newId(prefix = "t") {
  return `${prefix}_${Math.random().toString(16).slice(2)}${Date.now().toString(16)}`;
}
