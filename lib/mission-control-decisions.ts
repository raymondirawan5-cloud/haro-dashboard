import fs from "node:fs";
import path from "node:path";

export const WORKSPACE_DIR = process.env.HARO_WORKSPACE_DIR || "/home/ray/.openclaw/workspace";
const DECISIONS_DIR = path.join(WORKSPACE_DIR, ".openclaw", "decisions");

export const SUPPORTED_PROJECT = "padel-tracker-v1";
export const PROJECT_DECISIONS_PATH = path.join(DECISIONS_DIR, `${SUPPORTED_PROJECT}.json`);

export type DecisionStatus = "pending" | "approved" | "rejected";

export type DecisionItem = {
  id: string;
  title: string;
  blocker: string;
  choice: string;
  status: DecisionStatus;
  approvedBy: string;
  approvedAt: string;
};

export type DecisionsFile = {
  project: string;
  updatedAt: string | null;
  decisions: DecisionItem[];
};

function defaultDecisions(): DecisionsFile {
  return {
    project: SUPPORTED_PROJECT,
    updatedAt: null,
    decisions: [
      {
        id: "fixtures",
        title: "Validation fixture videos",
        blocker: "No agreed sample videos for Tracker V1 validation fixtures.",
        choice: "Use 8 videos (3 easy, 3 medium, 2 hard) in one frozen fixture directory.",
        status: "pending",
        approvedBy: "",
        approvedAt: "",
      },
      {
        id: "error-taxonomy",
        title: "Forced vs unforced error taxonomy",
        blocker: "Error definitions are ambiguous and labels drift across reviewers.",
        choice:
          "Use strict baseline: unforced under normal pressure, forced when opponent action materially reduces response success; uncertain => unknown_error_type.",
        status: "pending",
        approvedBy: "",
        approvedAt: "",
      },
      {
        id: "identity-swap",
        title: "Identity swap correction flow",
        blocker: "Player A/B identity swaps happen but correction flow is undefined.",
        choice:
          "Add Swap Player Identity in review panel, allow segment + whole-session scope, store identity_swap_corrected event as non-destructive overlay.",
        status: "pending",
        approvedBy: "",
        approvedAt: "",
      },
      {
        id: "coordinate-convention",
        title: "Court coordinate convention",
        blocker: "Coordinate system is not frozen for downstream KPI consistency.",
        choice:
          "Normalize to [0,1], origin (0,0) at near-left from camera perspective, +x right, +y toward far side; keep raw pixel coordinates separately.",
        status: "pending",
        approvedBy: "",
        approvedAt: "",
      },
      {
        id: "confidence-policy",
        title: "Confidence calibration policy",
        blocker: "Confidence thresholds are inconsistent and KPI inclusion is ambiguous.",
        choice:
          "Set thresholds: <0.55 low_confidence, 0.55-0.75 review_recommended, >=0.75 accepted_for_kpi; report strict and relaxed KPI aggregates.",
        status: "pending",
        approvedBy: "",
        approvedAt: "",
      },
    ],
  };
}

function ensureDecisionsDir() {
  fs.mkdirSync(DECISIONS_DIR, { recursive: true });
}

function sanitizeStatus(input: unknown): DecisionStatus {
  return input === "approved" || input === "rejected" ? input : "pending";
}

function normalizeDecision(entry: Partial<DecisionItem>, index: number): DecisionItem {
  return {
    id: typeof entry.id === "string" && entry.id.trim() ? entry.id.trim() : `decision-${index + 1}`,
    title: typeof entry.title === "string" ? entry.title : `Decision ${index + 1}`,
    blocker: typeof entry.blocker === "string" ? entry.blocker : "",
    choice: typeof entry.choice === "string" ? entry.choice : "",
    status: sanitizeStatus(entry.status),
    approvedBy: typeof entry.approvedBy === "string" ? entry.approvedBy : "",
    approvedAt: typeof entry.approvedAt === "string" ? entry.approvedAt : "",
  };
}

export function readOrBootstrapProjectDecisions(project: string): DecisionsFile {
  if (project !== SUPPORTED_PROJECT) {
    throw new Error("unsupported project");
  }

  if (!fs.existsSync(PROJECT_DECISIONS_PATH)) {
    const seeded = defaultDecisions();
    ensureDecisionsDir();
    fs.writeFileSync(PROJECT_DECISIONS_PATH, `${JSON.stringify(seeded, null, 2)}\n`, "utf8");
    return seeded;
  }

  try {
    const raw = fs.readFileSync(PROJECT_DECISIONS_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<DecisionsFile>;

    const decisions = Array.isArray(parsed.decisions)
      ? parsed.decisions.map((entry, idx) => normalizeDecision(entry, idx))
      : defaultDecisions().decisions;

    return {
      project: SUPPORTED_PROJECT,
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : null,
      decisions,
    };
  } catch {
    const fallback = defaultDecisions();
    ensureDecisionsDir();
    fs.writeFileSync(PROJECT_DECISIONS_PATH, `${JSON.stringify(fallback, null, 2)}\n`, "utf8");
    return fallback;
  }
}

function writeProjectDecisions(data: DecisionsFile): DecisionsFile {
  const next: DecisionsFile = {
    ...data,
    project: SUPPORTED_PROJECT,
    updatedAt: new Date().toISOString(),
  };

  ensureDecisionsDir();
  fs.writeFileSync(PROJECT_DECISIONS_PATH, `${JSON.stringify(next, null, 2)}\n`, "utf8");
  return next;
}

export function updateDecision(input: {
  project: string;
  id: string;
  choice?: string;
  status?: DecisionStatus;
  approvedBy?: string;
  approvedAt?: string;
}) {
  const current = readOrBootstrapProjectDecisions(input.project);
  const idx = current.decisions.findIndex((d) => d.id === input.id);
  if (idx < 0) return null;

  const prev = current.decisions[idx];
  const next: DecisionItem = {
    ...prev,
    choice: typeof input.choice === "string" ? input.choice : prev.choice,
    status: sanitizeStatus(input.status ?? prev.status),
    approvedBy: typeof input.approvedBy === "string" ? input.approvedBy : prev.approvedBy,
    approvedAt: typeof input.approvedAt === "string" ? input.approvedAt : prev.approvedAt,
  };

  const saved = writeProjectDecisions({
    ...current,
    decisions: [...current.decisions.slice(0, idx), next, ...current.decisions.slice(idx + 1)],
  });

  return {
    decision: next,
    data: saved,
  };
}
