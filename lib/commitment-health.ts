import type { ProofFile, TaskItem, TodayCommitment } from "@/lib/mission-control-store";

export type CommitmentHealthStatus = "healthy" | "at_risk" | "blocked" | "done_verified" | "done_unverified";

export type CommitmentWithHealth = TodayCommitment & { health_status: CommitmentHealthStatus };

export type CommitmentHealthResult = {
  counts: Record<CommitmentHealthStatus, number>;
  commitments: CommitmentWithHealth[];
};

const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;
const TEN_MINUTES_MS = 10 * 60 * 1000;

function timeFromCommitment(commitment: TodayCommitment): number {
  const source = commitment.last_updated_at || commitment.created_at;
  const ts = Date.parse(source);
  return Number.isNaN(ts) ? 0 : ts;
}

export function analyzeCommitments(today: { commitments?: TodayCommitment[] }, tasks: TaskItem[], proof: ProofFile): CommitmentHealthResult {
  const counts: Record<CommitmentHealthStatus, number> = {
    healthy: 0,
    at_risk: 0,
    blocked: 0,
    done_verified: 0,
    done_unverified: 0,
  };

  const nowTs = Date.now();
  const taskProofByTaskId = new Map<string, string>();

  for (const item of proof.task_proofs) {
    taskProofByTaskId.set(item.task_id, item.reference);
  }

  for (const task of tasks) {
    if (task.proof_id) taskProofByTaskId.set(task.id, task.proof_id);
  }

  const commitments = (today.commitments || []).map((commitment) => {
    const updatedTs = timeFromCommitment(commitment);
    const ageMs = Math.max(0, nowTs - updatedTs);
    const proofId = commitment.proof_id || taskProofByTaskId.get(commitment.task_id) || null;

    let health_status: CommitmentHealthStatus = "healthy";

    if (commitment.status === "done" && proofId) {
      health_status = "done_verified";
    } else if (commitment.status === "done" && !proofId && ageMs > TEN_MINUTES_MS) {
      health_status = "done_unverified";
    } else if (commitment.status === "blocked") {
      health_status = "blocked";
    } else if ((commitment.status === "committed" || commitment.status === "in_progress") && ageMs > FOUR_HOURS_MS) {
      health_status = "at_risk";
    }

    counts[health_status] += 1;
    return { ...commitment, health_status, ...(proofId ? { proof_id: proofId } : {}) };
  });

  return { counts, commitments };
}
