export type Commitment = {
  id: string;
  title: string;
  task_id: string;
  decision_id: string;
  status: "committed" | "in_progress" | "blocked" | "done";
  proof_required: boolean;
  proof_id: string | null;
  created_at: string;
  last_updated_at?: string;
  health_status?: "healthy" | "at_risk" | "blocked" | "done_verified" | "done_unverified";
};

export type Proof = {
  generated_at: string;
  task_proofs: Array<{ task_id: string; proof_type: string; reference: string }>;
  commits: unknown[];
  deployments: unknown[];
};

export type HealthSummary = {
  healthy: number;
  at_risk: number;
  blocked: number;
  done_verified: number;
  done_unverified: number;
};

export type HealthResponse = {
  status: "healthy" | "warning" | "critical";
  summary: HealthSummary;
  commitments: Commitment[];
};
