import fs from "node:fs";
import path from "node:path";

const WORKSPACE_DIR = process.env.HARO_WORKSPACE_DIR || "/home/ray/.openclaw/workspace";
const DATA_ROOT = path.join(WORKSPACE_DIR, ".openclaw");

export const TODAY_PATH = path.join(DATA_ROOT, "mission-control", "today.json");
export const TASKS_PATH = path.join(DATA_ROOT, "tasks.json");
export const DECISIONS_DIR = path.join(DATA_ROOT, "decisions");
export const PROOF_PATH = path.join(DATA_ROOT, "proof", "latest.json");

export type CommitmentStatus = "committed" | "in_progress" | "blocked" | "done";
export type TaskStatus = "pending" | "active" | "blocked" | "complete";

export type TodayCommitment = {
  id: string;
  title: string;
  task_id: string;
  decision_id: string;
  status: CommitmentStatus;
  proof_required: boolean;
  proof_id: string | null;
};

export type TodayFile = {
  date: string;
  commitments: TodayCommitment[];
};

export type TaskItem = {
  id: string;
  title: string;
  status: TaskStatus;
  decision_id: string;
  proof_id: string | null;
  created_at: string;
  updated_at: string;
};

export type TasksFile = { tasks: TaskItem[]; updated_at: string };

export type ProofFile = {
  generated_at: string;
  commits: unknown[];
  deployments: unknown[];
  task_proofs: Array<{
    task_id: string;
    proof_type: "commit" | "deploy" | "manual";
    reference: string;
  }>;
};

function ensureDirFor(filePath: string) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function readJson<T>(filePath: string): T | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
  } catch {
    return null;
  }
}

function writeJson(filePath: string, data: unknown) {
  ensureDirFor(filePath);
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function todayDefault(): TodayFile {
  return { date: new Date().toISOString().slice(0, 10), commitments: [] };
}

function isCommitmentStatus(value: unknown): value is CommitmentStatus {
  return value === "committed" || value === "in_progress" || value === "blocked" || value === "done";
}

function isTaskStatus(value: unknown): value is TaskStatus {
  return value === "pending" || value === "active" || value === "blocked" || value === "complete";
}

export function readToday(): TodayFile {
  const parsed = readJson<Partial<TodayFile>>(TODAY_PATH);
  const fallback = todayDefault();

  if (!parsed) {
    writeJson(TODAY_PATH, fallback);
    return fallback;
  }

  const commitments = Array.isArray(parsed.commitments)
    ? parsed.commitments.map((item, index) => {
        const raw = item as Partial<TodayCommitment>;
        return {
          id: typeof raw.id === "string" && raw.id.trim() ? raw.id : `commitment-${index + 1}`,
          title: typeof raw.title === "string" ? raw.title : "",
          task_id: typeof raw.task_id === "string" ? raw.task_id : "",
          decision_id: typeof raw.decision_id === "string" ? raw.decision_id : "",
          status: isCommitmentStatus(raw.status) ? raw.status : "committed",
          proof_required: raw.proof_required !== false,
          proof_id: typeof raw.proof_id === "string" ? raw.proof_id : null,
        };
      })
    : [];

  const normalized: TodayFile = {
    date: typeof parsed.date === "string" && parsed.date ? parsed.date : fallback.date,
    commitments,
  };

  writeJson(TODAY_PATH, normalized);
  return normalized;
}

export function writeToday(data: TodayFile): TodayFile {
  const normalized: TodayFile = {
    date: data.date || new Date().toISOString().slice(0, 10),
    commitments: Array.isArray(data.commitments) ? data.commitments : [],
  };
  writeJson(TODAY_PATH, normalized);
  return normalized;
}

function tasksDefault(): TasksFile {
  return { tasks: [], updated_at: new Date().toISOString() };
}

export function readTasks(): TasksFile {
  const parsed = readJson<Partial<TasksFile>>(TASKS_PATH);
  if (!parsed) {
    const seed = tasksDefault();
    writeJson(TASKS_PATH, seed);
    return seed;
  }

  const now = new Date().toISOString();
  const tasks = Array.isArray(parsed.tasks)
    ? parsed.tasks.map((item, idx) => {
        const raw = item as Partial<TaskItem>;
        return {
          id: typeof raw.id === "string" && raw.id.trim() ? raw.id : `task-${idx + 1}`,
          title: typeof raw.title === "string" ? raw.title : "",
          status: isTaskStatus(raw.status) ? raw.status : "pending",
          decision_id: typeof raw.decision_id === "string" ? raw.decision_id : "",
          proof_id: typeof raw.proof_id === "string" ? raw.proof_id : null,
          created_at: typeof raw.created_at === "string" ? raw.created_at : now,
          updated_at: typeof raw.updated_at === "string" ? raw.updated_at : now,
        };
      })
    : [];

  const normalized: TasksFile = {
    tasks,
    updated_at: typeof parsed.updated_at === "string" ? parsed.updated_at : now,
  };
  writeJson(TASKS_PATH, normalized);
  return normalized;
}

export function writeTasks(file: TasksFile): TasksFile {
  const normalized = { ...file, updated_at: new Date().toISOString() };
  writeJson(TASKS_PATH, normalized);
  return normalized;
}

export type DecisionRecord = { id: string; status?: string; [key: string]: unknown };

export function readDecisionsIndex(): Map<string, DecisionRecord> {
  fs.mkdirSync(DECISIONS_DIR, { recursive: true });
  const files = fs.readdirSync(DECISIONS_DIR).filter((f) => f.endsWith(".json"));
  const map = new Map<string, DecisionRecord>();

  for (const file of files) {
    const full = path.join(DECISIONS_DIR, file);
    const parsed = readJson<unknown>(full);
    if (!parsed) continue;

    if (Array.isArray((parsed as { decisions?: unknown[] }).decisions)) {
      const list = (parsed as { decisions: unknown[] }).decisions;
      for (const item of list) {
        const d = item as DecisionRecord;
        if (typeof d?.id === "string" && d.id) map.set(d.id, d);
      }
      continue;
    }

    const single = parsed as DecisionRecord;
    if (typeof single?.id === "string" && single.id) map.set(single.id, single);
  }

  if (!map.size) {
    const defaultDecision = {
      id: "default-decision",
      title: "Default seeded decision",
      status: "pending",
      updated_at: new Date().toISOString(),
    };
    writeJson(path.join(DECISIONS_DIR, "default.json"), defaultDecision);
    map.set(defaultDecision.id, defaultDecision);
  }

  return map;
}

function proofDefault(): ProofFile {
  return {
    generated_at: new Date().toISOString(),
    commits: [],
    deployments: [],
    task_proofs: [],
  };
}

export function readProofLatest(): ProofFile {
  const parsed = readJson<Partial<ProofFile>>(PROOF_PATH);
  if (!parsed) {
    const seed = proofDefault();
    writeJson(PROOF_PATH, seed);
    return seed;
  }

  const normalized: ProofFile = {
    generated_at: typeof parsed.generated_at === "string" ? parsed.generated_at : new Date().toISOString(),
    commits: Array.isArray(parsed.commits) ? parsed.commits : [],
    deployments: Array.isArray(parsed.deployments) ? parsed.deployments : [],
    task_proofs: Array.isArray(parsed.task_proofs)
      ? parsed.task_proofs
          .map((item) => {
            const raw = item as Partial<ProofFile["task_proofs"][number]>;
            const proofType = raw.proof_type;
            if (!raw.task_id || !raw.reference) return null;
            if (proofType !== "commit" && proofType !== "deploy" && proofType !== "manual") return null;
            return {
              task_id: raw.task_id,
              proof_type: proofType,
              reference: raw.reference,
            };
          })
          .filter((item): item is ProofFile["task_proofs"][number] => Boolean(item))
      : [],
  };

  writeJson(PROOF_PATH, normalized);
  return normalized;
}
