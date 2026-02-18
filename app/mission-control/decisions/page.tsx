"use client";

import { useEffect, useMemo, useState } from "react";
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

export default function MissionControlDecisionsPage() {
  const [decisions, setDecisions] = useState<DecisionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState>({
    choice: "",
    status: "pending",
    approvedBy: "",
    approvedAt: "",
  });
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    fetch(apiUrl(`/api/mission-control/decisions?project=${PROJECT}`))
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load decisions");
        return res.json();
      })
      .then((data) => {
        setDecisions(data.decisions || []);
        setError(null);
      })
      .catch(() => {
        setError("Unable to load decisions right now.");
        setDecisions([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const pendingCount = useMemo(
    () => decisions.filter((decision) => decision.status === "pending").length,
    [decisions],
  );

  function startEdit(decision: DecisionItem) {
    setEditingId(decision.id);
    setFeedback(null);
    setEditState({
      choice: decision.choice || "",
      status: decision.status || "pending",
      approvedBy: decision.approvedBy || "",
      approvedAt: decision.approvedAt || "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditState({ choice: "", status: "pending", approvedBy: "", approvedAt: "" });
  }

  async function saveDecision(id: string) {
    setSavingId(id);
    setFeedback(null);
    try {
      const response = await fetch(apiUrl("/api/mission-control/decisions"), {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          project: PROJECT,
          id,
          choice: editState.choice,
          status: editState.status,
          approvedBy: editState.approvedBy,
          approvedAt: editState.approvedAt,
        }),
      });

      if (!response.ok) throw new Error("save failed");

      const data = await response.json();
      setDecisions(data.decisions || []);
      setFeedback("Decision saved.");
      cancelEdit();
    } catch {
      setError("Save failed. Please retry.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <section>
      <div className="decision-header">
        <h2>Mission Control · Decision Sign-off</h2>
        <span className="badge status-pending">Pending: {pendingCount}</span>
      </div>
      <p className="muted">Approve or reject Tracker V1 blocker decisions without editing markdown.</p>

      {loading ? <p className="muted">Loading decisions...</p> : null}
      {error ? <p className="muted">{error}</p> : null}
      {feedback ? <p className="muted">{feedback}</p> : null}

      <div className="stack">
        {decisions.map((decision) => {
          const isEditing = editingId === decision.id;
          return (
            <article key={decision.id} className="panel">
              <div className="decision-header">
                <h3>{decision.title}</h3>
                <span className={`badge status-chip status-${decision.status}`}>{decision.status}</span>
              </div>
              <p className="muted small">{decision.blocker}</p>

              {isEditing ? (
                <div className="stack compact">
                  <label className="small muted">Choice</label>
                  <textarea
                    value={editState.choice}
                    onChange={(e) => setEditState((prev) => ({ ...prev, choice: e.target.value }))}
                    rows={3}
                    placeholder="Decision choice text"
                  />

                  <div className="grid two">
                    <div>
                      <label className="small muted">Status</label>
                      <select
                        value={editState.status}
                        onChange={(e) =>
                          setEditState((prev) => ({ ...prev, status: e.target.value as DecisionStatus }))
                        }
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
                        onChange={(e) => setEditState((prev) => ({ ...prev, approvedBy: e.target.value }))}
                        placeholder="Ray"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="small muted">Approval date</label>
                    <input
                      type="date"
                      value={editState.approvedAt}
                      onChange={(e) => setEditState((prev) => ({ ...prev, approvedAt: e.target.value }))}
                    />
                  </div>

                  <div className="inline-actions">
                    <button type="button" onClick={() => saveDecision(decision.id)} disabled={savingId === decision.id}>
                      {savingId === decision.id ? "Saving..." : "Save changes"}
                    </button>
                    <button type="button" className="ghost-btn" onClick={cancelEdit}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p>{decision.choice || "No choice recorded yet."}</p>
                  <p className="small muted">
                    Approved by: {decision.approvedBy || "-"} · Date: {decision.approvedAt || "-"}
                  </p>
                  <div className="inline-actions">
                    <button type="button" className="ghost-btn" onClick={() => startEdit(decision)}>
                      Edit / Sign off
                    </button>
                  </div>
                </>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
