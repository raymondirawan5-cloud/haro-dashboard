import fs from "node:fs";
import path from "node:path";

const WORKSPACE_DIR = process.env.HARO_WORKSPACE_DIR || "/home/ray/.openclaw/workspace";
export const TODAY_PATH =
  process.env.HARO_MISSION_CONTROL_TODAY_PATH ||
  path.join(WORKSPACE_DIR, ".openclaw", "mission-control", "today.json");

type FocusBlock = {
  task: string;
  notes?: string;
};

export type BlockerItem = {
  id: string;
  text: string;
  owner: "ray" | "haro" | "shared";
  due: string;
};

export type MissionToday = {
  updatedAt: string | null;
  rayNext90: FocusBlock;
  haroNext90: FocusBlock;
  blockers: BlockerItem[];
};

function defaults(): MissionToday {
  return {
    updatedAt: null,
    rayNext90: {
      task: "Review shipped evidence + set the single decision to unblock today",
      notes: "Keep scope narrow. One decision, one owner, one next action.",
    },
    haroNext90: {
      task: "Implement the next blocker item and post proof commit",
      notes: "Do not multitask: finish, validate, then update task board.",
    },
    blockers: [
      {
        id: "b1",
        text: "Approve pending Tracker V1 blocker decisions",
        owner: "ray",
        due: new Date().toISOString().slice(0, 10),
      },
    ],
  };
}

function ensureDir() {
  fs.mkdirSync(path.dirname(TODAY_PATH), { recursive: true });
}

function normalizeBlocker(input: Partial<BlockerItem>, index: number): BlockerItem {
  const owner = input.owner === "ray" || input.owner === "haro" ? input.owner : "shared";
  return {
    id: typeof input.id === "string" && input.id.trim() ? input.id.trim() : `b${index + 1}`,
    text: typeof input.text === "string" ? input.text : "",
    owner,
    due: typeof input.due === "string" ? input.due : "",
  };
}

export function readOrBootstrapToday(): MissionToday {
  if (!fs.existsSync(TODAY_PATH)) {
    const seeded = defaults();
    ensureDir();
    fs.writeFileSync(TODAY_PATH, `${JSON.stringify(seeded, null, 2)}\n`, "utf8");
    return seeded;
  }

  try {
    const raw = fs.readFileSync(TODAY_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<MissionToday>;

    return {
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : null,
      rayNext90: {
        task: typeof parsed.rayNext90?.task === "string" ? parsed.rayNext90.task : defaults().rayNext90.task,
        notes: typeof parsed.rayNext90?.notes === "string" ? parsed.rayNext90.notes : "",
      },
      haroNext90: {
        task: typeof parsed.haroNext90?.task === "string" ? parsed.haroNext90.task : defaults().haroNext90.task,
        notes: typeof parsed.haroNext90?.notes === "string" ? parsed.haroNext90.notes : "",
      },
      blockers: Array.isArray(parsed.blockers) ? parsed.blockers.map((b, idx) => normalizeBlocker(b, idx)) : defaults().blockers,
    };
  } catch {
    const fallback = defaults();
    ensureDir();
    fs.writeFileSync(TODAY_PATH, `${JSON.stringify(fallback, null, 2)}\n`, "utf8");
    return fallback;
  }
}

export function updateToday(next: MissionToday): MissionToday {
  const normalized: MissionToday = {
    updatedAt: new Date().toISOString(),
    rayNext90: {
      task: next.rayNext90?.task?.trim() || defaults().rayNext90.task,
      notes: next.rayNext90?.notes?.trim() || "",
    },
    haroNext90: {
      task: next.haroNext90?.task?.trim() || defaults().haroNext90.task,
      notes: next.haroNext90?.notes?.trim() || "",
    },
    blockers: Array.isArray(next.blockers)
      ? next.blockers
          .map((b, idx) => normalizeBlocker(b, idx))
          .filter((b) => b.text.trim())
      : [],
  };

  ensureDir();
  fs.writeFileSync(TODAY_PATH, `${JSON.stringify(normalized, null, 2)}\n`, "utf8");
  return normalized;
}
