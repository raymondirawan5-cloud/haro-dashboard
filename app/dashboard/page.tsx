"use client";

import { useEffect, useMemo, useState } from "react";
import { apiUrl } from "@/lib/client-api-base";

type Commitment = {
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

type Task = {
  id: string;
  title: string;
  status: "pending" | "active" | "blocked" | "complete";
  decision_id: string;
};

type Proof = {
  generated_at: string;
  task_proofs: Array<{ task_id: string; proof_type: string; reference: string }>;
  commits: unknown[];
  deployments: unknown[];
};

type HealthSummary = {
  healthy: number;
  at_risk: number;
  blocked: number;
  done_verified: number;
  done_unverified: number;
};

type HealthResponse = {
  status: "healthy" | "warning" | "critical";
  summary: HealthSummary;
  commitments: Commitment[];
};

const DEFAULT_SUMMARY: HealthSummary = {
  healthy: 0,
  at_risk: 0,
  blocked: 0,
  done_verified: 0,
  done_unverified: 0,
};

function lastActivity(item: Commitment): number {
  const ts = Date.parse(item.last_updated_at || item.created_at);
  return Number.isNaN(ts) ? 0 : ts;
}

export default function DashboardPage() {
  const [date, setDate] = useState("");
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [proof, setProof] = useState<Proof>({ generated_at: "", task_proofs: [], commits: [], deployments: [] });
  const [healthStatus, setHealthStatus] = useState<HealthResponse["status"]>("healthy");
  const [healthSummary, setHealthSummary] = useState<HealthSummary>(DEFAULT_SUMMARY);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function loadAll() {
    const [todayRes, tasksRes, proofRes, healthRes] = await Promise.all([
      fetch(apiUrl("/api/mission-control/today")),
      fetch(apiUrl("/api/tasks")),
      fetch(apiUrl("/api/proof/latest")),
      fetch(apiUrl("/api/mission-control/health")),
    ]);

    if (!todayRes.ok || !tasksRes.ok || !proofRes.ok || !healthRes.ok) {
      throw new Error("failed loading dashboard data");
    }

    const todayData = await todayRes.json();
    const tasksData = await tasksRes.json();
    const proofData = await proofRes.json();
    const healthData = (await healthRes.json()) as HealthResponse;

    setDate(typeof todayData.date === "string" ? todayData.date : "");
    setCommitments(Array.isArray(healthData.commitments) ? healthData.commitments : []);
    setTasks(Array.isArray(tasksData.tasks) ? tasksData.tasks : []);
    setProof(proofData as Proof);
    setHealthStatus(["healthy", "warning", "critical"].includes(healthData.status) ? healthData.status : "healthy");
    setHealthSummary(healthData.summary || DEFAULT_SUMMARY);
  }

  useEffect(() => {
    loadAll().catch(() => setFeedback("Failed to load mission control dashboard."));
  }, []);

  const blocked = useMemo(() => commitments.filter((item) => item.status === "blocked"), [commitments]);
  const atRiskCommitments = useMemo(
    () =>
      commitments
        .filter((item) => item.health_status === "at_risk" || item.health_status === "done_unverified")
        .sort((a, b) => lastActivity(a) - lastActivity(b)),
    [commitments],
  );
  const uncommittedTasks = useMemo(() => {
    const committedTaskIds = new Set(commitments.map((c) => c.task_id));
    return tasks.filter((task) => task.status !== "complete" && !committedTaskIds.has(task.id));
  }, [tasks, commitments]);

  async function commitTask(taskId: string) {
    setFeedback(null);
    const res = await fetch(apiUrl("/api/mission-control/commit-task-to-today"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ task_id: taskId }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setFeedback(typeof body.error === "string" ? body.error : "Commit failed.");
      return;
    }

    await loadAll();
  }

  async function transitionCommitment(id: string, status: Commitment["status"]) {
    setFeedback(null);
    const res = await fetch(apiUrl("/api/mission-control/update-status"), {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, status }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setFeedback(typeof body.error === "string" ? body.error : "Status transition failed.");
      return;
    }

    await loadAll();
  }

  async function resetDay() {
    setFeedback(null);
    const res = await fetch(apiUrl("/api/mission-control/reset-day"), { method: "POST" });
    if (!res.ok) {
      setFeedback("Failed to reset day.");
      return;
    }

    await loadAll();
  }

  return (
    <section>
      <h2>Mission Control</h2>
      <p className="muted small">Date: {date || "-"}</p>
      {feedback ? <p className="muted">{feedback}</p> : null}
      <button type="button" onClick={resetDay}>Reset Day</button>

      <article className="panel" style={{ marginTop: 12 }}>
        <h3>Mission Control Health <span className="badge">{healthStatus.toUpperCase()}</span></h3>
        <p className="small muted">
          Healthy: {healthSummary.healthy} · At Risk: {healthSummary.at_risk} · Blocked: {healthSummary.blocked} · Done Verified: {healthSummary.done_verified} · Done Unverified: {healthSummary.done_unverified}
        </p>
      </article>

      <article className="panel" style={{ marginTop: 12 }}>
        <h3>At Risk Commitments</h3>
        <div className="stack">
          {atRiskCommitments.map((item) => (
            <div key={item.id} className="card evidence-card">
              <div className="decision-header">
                <strong>{item.title}</strong>
                <span className="badge">{item.health_status}</span>
              </div>
              <p className="small muted">task_id: {item.task_id} · decision_id: {item.decision_id}</p>
              <p className="small muted">last_activity: {item.last_updated_at || item.created_at}</p>
            </div>
          ))}
          {!atRiskCommitments.length ? <p className="muted small">No at risk commitments.</p> : null}
        </div>
      </article>

      <article className="panel" style={{ marginTop: 12 }}>
        <h3>Today Commitments</h3>
        <div className="stack">
          {commitments.map((item) => (
            <div key={item.id} className="card evidence-card">
              <div className="decision-header">
                <strong>{item.title}</strong>
                <span className="badge">{item.status}</span>
              </div>
              <p className="small muted">task_id: {item.task_id} · decision_id: {item.decision_id}</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {item.status === "committed" ? (
                  <button type="button" onClick={() => transitionCommitment(item.id, "in_progress")}>Start</button>
                ) : null}
                {item.status === "in_progress" ? (
                  <>
                    <button type="button" onClick={() => transitionCommitment(item.id, "blocked")}>Block</button>
                    <button type="button" onClick={() => transitionCommitment(item.id, "done")}>Complete</button>
                  </>
                ) : null}
                {item.status === "blocked" ? (
                  <button type="button" onClick={() => transitionCommitment(item.id, "in_progress")}>Start</button>
                ) : null}
              </div>
            </div>
          ))}
          {!commitments.length ? <p className="muted small">No commitments.</p> : null}
        </div>
      </article>

      <article className="panel" style={{ marginTop: 12 }}>
        <h3>Blocked Commitments</h3>
        <div className="stack">
          {blocked.map((item) => (
            <div key={item.id} className="card evidence-card">
              <strong>{item.title}</strong>
              <p className="small muted">task_id: {item.task_id} · decision_id: {item.decision_id}</p>
            </div>
          ))}
          {!blocked.length ? <p className="muted small">No blocked commitments.</p> : null}
        </div>
      </article>

      <article className="panel" style={{ marginTop: 12 }}>
        <h3>Uncommitted Tasks</h3>
        <div className="stack">
          {uncommittedTasks.map((task) => (
            <div key={task.id} className="card evidence-card">
              <strong>{task.title}</strong>
              <p className="small muted">task_id: {task.id} · decision_id: {task.decision_id}</p>
              <button type="button" onClick={() => commitTask(task.id)}>Commit to Today</button>
            </div>
          ))}
          {!uncommittedTasks.length ? <p className="muted small">No uncommitted tasks.</p> : null}
        </div>
      </article>

      <article className="panel" style={{ marginTop: 12 }}>
        <h3>Latest Proof Evidence</h3>
        <p className="muted small">generated_at: {proof.generated_at || "-"}</p>
        <p className="small muted">commits: {proof.commits.length} · deployments: {proof.deployments.length}</p>
        <div className="stack">
          {proof.task_proofs.map((item, idx) => (
            <div key={`${item.task_id}-${idx}`} className="card evidence-card">
              <strong>{item.task_id}</strong>
              <p className="small muted">{item.proof_type}: {item.reference}</p>
            </div>
          ))}
          {!proof.task_proofs.length ? <p className="muted small">No task proof entries.</p> : null}
        </div>
      </article>
    </section>
  );
}
