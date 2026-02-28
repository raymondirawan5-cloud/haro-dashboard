"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { apiUrl } from "@/lib/client-api-base";
import { useToast } from "@/components/ui/Toast";

type Commitment = {
  id: string;
  title: string;
  task_id: string;
  decision_id: string;
  status: "committed" | "in_progress" | "blocked" | "done";
  proof_required: boolean;
  proof_id: string | null;
};

type TodayPayload = {
  date: string;
  commitments: Commitment[];
};

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">🎯</div>
      <div className="empty-state-title">No commitments yet</div>
      <p className="small muted">Add your first commitment to start tracking your mission.</p>
      <button onClick={onAdd} style={{ marginTop: 16 }}>
        Add Commitment
      </button>
    </div>
  );
}

function StatusBadge({ status }: { status: Commitment["status"] }) {
  const labels: Record<Commitment["status"], string> = {
    committed: "Committed",
    in_progress: "In Progress",
    blocked: "Blocked",
    done: "Done",
  };

  return (
    <span className="badge" style={{ fontSize: 11, textTransform: "capitalize" }}>
      {labels[status]}
    </span>
  );
}

export default function MissionControlTodayPage() {
  const [date, setDate] = useState("");
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [taskId, setTaskId] = useState("");
  const [decisionId, setDecisionId] = useState("");
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();
  const formRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(apiUrl("/api/mission-control/today"));
      const data = (await res.json()) as TodayPayload;
      setDate(data.date);
      setCommitments(Array.isArray(data.commitments) ? data.commitments : []);
    } catch {
      showToast("Failed to load today commitments.", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  async function addCommitment() {
    if (!title.trim()) {
      showToast("Title is required.", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(apiUrl("/api/mission-control/commit"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          task_id: taskId.trim() || undefined,
          decision_id: decisionId.trim() || undefined,
          proof_required: true,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setTitle("");
      setTaskId("");
      setDecisionId("");
      await load();
      showToast("Commitment created.", "success");
    } catch {
      showToast("Failed to create commitment.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function setStatus(id: string, status: Commitment["status"]) {
    try {
      const res = await fetch(apiUrl("/api/mission-control/update-status"), {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error("Failed");
      await load();
      showToast("Status updated.", "success");
    } catch {
      showToast("Status update failed.", "error");
    }
  }

  const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: "smooth" });

  return (
    <section className="animate-fade-in">
      <div className="decision-header" style={{ marginBottom: 8 }}>
        <div>
          <h2>Mission Control · Today</h2>
          <p className="muted small">today.json is the single execution authority.</p>
        </div>
        <span className="badge">{date || "—"}</span>
      </div>

      {loading ? (
        <div className="stack" style={{ marginTop: 24 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="panel">
              <div className="skeleton" style={{ height: 60 }} />
            </div>
          ))}
        </div>
      ) : (
        <>
          <article ref={formRef} className="panel" style={{ marginTop: 16 }}>
            <h3>New Commitment</h3>
            <div className="stack" style={{ marginTop: 12 }}>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What are you committing to today?"
                onKeyDown={(e) => e.key === "Enter" && addCommitment()}
              />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <input
                  value={taskId}
                  onChange={(e) => setTaskId(e.target.value)}
                  placeholder="task_id (optional)"
                />
                <input
                  value={decisionId}
                  onChange={(e) => setDecisionId(e.target.value)}
                  placeholder="decision_id (optional)"
                />
              </div>
              <div className="inline-actions" style={{ marginTop: 4 }}>
                <button type="button" onClick={addCommitment} disabled={saving || !title.trim()}>
                  {saving ? "Creating..." : "Create commitment"}
                </button>
              </div>
            </div>
          </article>

          <article className="panel" style={{ marginTop: 16 }}>
            <div className="decision-header">
              <h3>Commitments</h3>
              <span className="badge">{commitments.length}</span>
            </div>
            <div className="stack" style={{ marginTop: 12 }}>
              {commitments.length === 0 ? (
                <EmptyState onAdd={scrollToForm} />
              ) : (
                commitments.map((item) => (
                  <div key={item.id} className="panel card-hover" style={{ padding: 12 }}>
                    <div className="decision-header" style={{ marginBottom: 8 }}>
                      <strong>{item.title}</strong>
                      <StatusBadge status={item.status} />
                    </div>
                    <p className="small muted" style={{ marginBottom: 12 }}>
                      {item.task_id && <span>task: {item.task_id}</span>}
                      {item.decision_id && (
                        <span>{item.task_id ? " · " : ""}decision: {item.decision_id}</span>
                      )}
                    </p>
                    <select
                      value={item.status}
                      onChange={(e) => setStatus(item.id, e.target.value as Commitment["status"])}
                      style={{ width: "auto", minWidth: 140 }}
                    >
                      <option value="committed">committed</option>
                      <option value="in_progress">in_progress</option>
                      <option value="blocked">blocked</option>
                      <option value="done">done</option>
                    </select>
                  </div>
                ))
              )}
            </div>
          </article>
        </>
      )}
    </section>
  );
}
