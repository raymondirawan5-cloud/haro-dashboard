"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useToast } from "@/components/ui/Toast";
import { apiUrl } from "@/lib/client-api-base";

type DecisionStatus = "pending" | "approved" | "rejected";

type DecisionItem = {
  id: string;
  title: string;
  blocker: string;
  choice: string;
  status: DecisionStatus;
  approvedBy: string;
  approvedAt: string;
};

type EditState = {
  choice: string;
  status: DecisionStatus;
  approvedBy: string;
  approvedAt: string;
};

const PROJECT = "padel-tracker-v1";

function StatusChip({ status }: { status: DecisionStatus }) {
  const styles: Record<DecisionStatus, { color: string; bg: string; border: string }> = {
    pending: { color: "#d7dce5", bg: "rgba(107, 114, 128, 0.13)", border: "#4b5563" },
    approved: { color: "#aef8ff", bg: "rgba(0, 240, 255, 0.1)", border: "#00a8b3" },
    rejected: { color: "#ffc4cf", bg: "rgba(255, 59, 92, 0.14)", border: "#8f2a3f" },
  };
  const s = styles[status];
  return (
    <span
      className="badge"
      style={{ color: s.color, background: s.bg, borderColor: s.border, textTransform: "capitalize" }}
    >
      {status}
    </span>
  );
}

export default function MissionControlDecisionsPage() {
  const [decisions, setDecisions] = useState<DecisionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState>({
    choice: "",
    status: "pending",
    approvedBy: "",
    approvedAt: "",
  });
  const [savingId, setSavingId] = useState<string | null>(null);
  const { showToast } = useToast();

  const load = useCallback(async () => {
    try {
      const res = await fetch(apiUrl(`/api/mission-control/decisions?project=${PROJECT}`));
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setDecisions(data.decisions || []);
      setError(null);
    } catch {
      setError("Unable to load decisions.");
      showToast("Unable to load decisions.", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const pendingCount = useMemo(
    () => decisions.filter((d) => d.status === "pending").length,
    [decisions]
  );

  const startEdit = (d: DecisionItem) => {
    setEditingId(d.id);
    setEditState({
      choice: d.choice || "",
      status: d.status,
      approvedBy: d.approvedBy || "",
      approvedAt: d.approvedAt || "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditState({ choice: "", status: "pending", approvedBy: "", approvedAt: "" });
  };

  const saveDecision = async (id: string) => {
    setSavingId(id);
    try {
      const res = await fetch(apiUrl("/api/mission-control/decisions"), {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ project: PROJECT, id, ...editState }),
      });
      if (!res.ok) throw new Error("Save failed");
      const data = await res.json();
      setDecisions(data.decisions || []);
      showToast("Decision saved.", "success");
      cancelEdit();
    } catch {
      showToast("Save failed.", "error");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <section className="animate-fade-in">
      <div className="decision-header" style={{ marginBottom: 8 }}>
        <div>
          <h2>Mission Control · Decision Sign-off</h2>
          <p className="muted small">Approve or reject Tracker V1 blocker decisions.</p>
        </div>
        <StatusChip status={pendingCount > 0 ? "pending" : "approved"} />
      </div>

      {loading ? (
        <div className="stack" style={{ marginTop: 24 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="panel">
              <div className="skeleton" style={{ height: 24, marginBottom: 12 }} />
              <div className="skeleton" style={{ height: 60 }} />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="empty-state" style={{ marginTop: 24 }}>
          <div className="empty-state-icon">⚠</div>
          <div className="empty-state-title">{error}</div>
          <button onClick={load} style={{ marginTop: 16 }}>Retry</button>
        </div>
      ) : decisions.length === 0 ? (
        <div className="empty-state" style={{ marginTop: 24 }}>
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-title">No decisions</div>
          <p className="small muted">No decisions found for this project.</p>
        </div>
      ) : (
        <div className="stack" style={{ marginTop: 16 }}>
          {decisions.map((d) => {
            const isEditing = editingId === d.id;
            return (
              <article key={d.id} className="panel card-hover">
                <div className="decision-header" style={{ marginBottom: 12 }}>
                  <h3>{d.title}</h3>
                  <StatusChip status={d.status} />
                </div>
                <p className="muted small" style={{ marginBottom: 12 }}>
                  {d.blocker}
                </p>

                {isEditing ? (
                  <div className="stack compact">
                    <label className="small muted">Choice</label>
                    <textarea
                      value={editState.choice}
                      onChange={(e) => setEditState((p) => ({ ...p, choice: e.target.value }))}
                      rows={3}
                    />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 8 }}>
                      <div>
                        <label className="small muted">Status</label>
                        <select
                          value={editState.status}
                          onChange={(e) => setEditState((p) => ({ ...p, status: e.target.value as DecisionStatus }))}
                        >
                          <option value="pending">pending</option>
                          <option value="approved">approved</option>
                          <option value="rejected">rejected</option>
                        </select>
                      </div>
                      <div>
                        <label className="small muted">Approved by</label>
                        <input
                          value={editState.approvedBy}
                          onChange={(e) => setEditState((p) => ({ ...p, approvedBy: e.target.value }))}
                          placeholder="Name"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="small muted">Approval date</label>
                      <input
                        type="date"
                        value={editState.approvedAt}
                        onChange={(e) => setEditState((p) => ({ ...p, approvedAt: e.target.value }))}
                      />
                    </div>
                    <div className="inline-actions" style={{ marginTop: 8 }}>
                      <button onClick={() => saveDecision(d.id)} disabled={savingId === d.id}>
                        {savingId === d.id ? "Saving..." : "Save changes"}
                      </button>
                      <button className="operator-btn-ghost" onClick={cancelEdit}>
                        Cancel
                      </button>
                    </div>
                  </div>

                ) : (
                  <>
                    <p style={{ marginBottom: 8 }}>{d.choice || "No choice recorded yet."}</p>
                    <p className="small muted">
                      Approved by: {d.approvedBy || "-"} · Date: {d.approvedAt || "-"}
                    </p>
                    <div className="inline-actions" style={{ marginTop: 12 }}>
                      <button className="operator-btn-ghost" onClick={() => startEdit(d)}>
                        Edit / Sign off
                      </button>
                    </div>
                  </>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
