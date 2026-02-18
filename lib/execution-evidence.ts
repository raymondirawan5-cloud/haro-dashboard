import fs from "node:fs";
import path from "node:path";

const WORKSPACE_DIR = process.env.HARO_WORKSPACE_DIR || "/home/ray/.openclaw/workspace";
export const EXECUTION_EVIDENCE_PATH =
  process.env.HARO_EXECUTION_EVIDENCE_PATH || path.join(WORKSPACE_DIR, ".openclaw", "proof", "latest.json");

type EvidenceCommit = {
  hash: string;
  short: string;
  date: string;
  subject: string;
  pushed?: boolean;
};

type EvidenceRepo = {
  name: string;
  branch?: string;
  path?: string;
  counts?: {
    commits?: number;
    pushedCommits?: number;
    localOnlyCommits?: number;
  };
  aheadBehind?: {
    ahead?: number;
    behind?: number;
  };
  pushedCommits?: EvidenceCommit[];
  localOnlyCommits?: EvidenceCommit[];
};

type EvidenceRaw = {
  generatedAt?: string;
  windowHours?: number;
  since?: string;
  summary?: {
    totalCommits?: number;
    totalPushedCommits?: number;
  };
  repos?: EvidenceRepo[];
};

export type ExecutionEvidenceRepo = {
  name: string;
  branch: string;
  shippedCommits: number;
  localOnlyCommits: number;
  shipped: EvidenceCommit[];
  localOnly: EvidenceCommit[];
  shippedReason: string;
};

export type ExecutionEvidenceData = {
  generatedAt: string | null;
  windowHours: number | null;
  since: string | null;
  totalCommits: number;
  pushedCommits: number;
  repos: ExecutionEvidenceRepo[];
};

function getZeroShipReason(repo: EvidenceRepo): string {
  const pushed = repo.counts?.pushedCommits ?? 0;
  if (pushed > 0) return "Shipped commits found.";

  const localOnly = repo.counts?.localOnlyCommits ?? repo.localOnlyCommits?.length ?? 0;
  if (localOnly > 0) return `No shipped commits yet (${localOnly} local-only waiting to push).`;

  const ahead = repo.aheadBehind?.ahead ?? 0;
  if (ahead > 0) return `Branch is ahead by ${ahead}, but no pushed commits were detected.`;

  return "No commits in the evidence window.";
}

function emptyEvidence(): ExecutionEvidenceData {
  return {
    generatedAt: null,
    windowHours: null,
    since: null,
    totalCommits: 0,
    pushedCommits: 0,
    repos: [],
  };
}

export function readExecutionEvidence(): ExecutionEvidenceData {
  if (!fs.existsSync(EXECUTION_EVIDENCE_PATH)) return emptyEvidence();

  try {
    const raw = fs.readFileSync(EXECUTION_EVIDENCE_PATH, "utf8");
    const parsed = JSON.parse(raw) as EvidenceRaw;
    const repos = Array.isArray(parsed.repos) ? parsed.repos : [];

    return {
      generatedAt: typeof parsed.generatedAt === "string" ? parsed.generatedAt : null,
      windowHours: typeof parsed.windowHours === "number" ? parsed.windowHours : null,
      since: typeof parsed.since === "string" ? parsed.since : null,
      totalCommits: parsed.summary?.totalCommits ?? repos.reduce((acc, repo) => acc + (repo.counts?.commits ?? 0), 0),
      pushedCommits:
        parsed.summary?.totalPushedCommits ?? repos.reduce((acc, repo) => acc + (repo.counts?.pushedCommits ?? 0), 0),
      repos: repos.map((repo) => {
        const shippedCommits = repo.counts?.pushedCommits ?? repo.pushedCommits?.length ?? 0;
        const localOnlyCommits = repo.counts?.localOnlyCommits ?? repo.localOnlyCommits?.length ?? 0;
        return {
          name: repo.name || "unknown-repo",
          branch: repo.branch || "unknown-branch",
          shippedCommits,
          localOnlyCommits,
          shipped: Array.isArray(repo.pushedCommits) ? repo.pushedCommits : [],
          localOnly: Array.isArray(repo.localOnlyCommits) ? repo.localOnlyCommits : [],
          shippedReason: shippedCommits === 0 ? getZeroShipReason(repo) : "Shipped commits detected in the window.",
        };
      }),
    };
  } catch {
    return emptyEvidence();
  }
}
