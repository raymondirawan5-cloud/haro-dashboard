"use client";

import { useEffect, useState } from "react";
import { apiUrl } from "@/lib/client-api-base";

type Commitment = {
  id: string;
  title: string;
  task_id: string;
  decision_id: string;
  status: "committed" | "in_progress" | "blocked" | "done";
  proof_required: boolean;
  proof_id: string | null;
};

type TodayPayload = { date: string; commitments: Commitment[] };

export default function MissionControlTodayPage() {
  const [date, setDate] = useState("");
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [title, setTitle] = useState("");
  const [taskId, setTaskId] = useState("");
  const [decisionId, setDecisionId] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  async function load() {
    const res = await fetch(apiUrl("/api/mission-control/today"));
    const data = (await res.json()) as TodayPayload;
    setDate(data.date);
    setCommitments(Array.isArray(data.commitments) ? data.commitments : []);
  }

  useEffect(() => {
    load().catch(() => setFeedback("Failed to load today commitments."));
  }, []);

  async function addCommitment() {
    setFeedback(null);
    const res = await fetch(apiUrl("/api/mission-control/commit"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title, task_id: taskId, decision_id: decisionId, proof_required: true }),
    });

    if (!res.ok) {
      setFeedback("Failed to create commitment.");
      return;
    }

    setTitle("");
    setTaskId("");
    setDecisionId("");
    await load();
    setFeedback("Commitment created.");
  }

  async function setStatus(id: string, status: Commitment["status"]) {
    const res = await fetch(apiUrl("/api/mission-control/update-status"), {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, status }),
    });

    if (!res.ok) {
      setFeedback("Status update failed.");
      return;
    }

    await load();
  }

  return (
    <section>
      <h2>Mission Control · Today</h2>
      <p className="muted">today.json is the single execution authority.</p>
      <p className="small muted">Date: {date || "-"}</p>
      {feedback ? <p className="muted">{feedback}</p> : null}

      <article className="panel" style={{ marginTop: 12 }}>
        <h3>Add Commitment</h3>
        <div className="stack">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
          <input value={taskId} onChange={(e) => setTaskId(e.target.value)} placeholder="task_id" />
          <input value={decisionId} onChange={(e) => setDecisionId(e.target.value)} placeholder="decision_id" />
          <button type="button" onClick={addCommitment}>Create commitment</button>
        </div>
      </article>

      <article className="panel" style={{ marginTop: 12 }}>
        <h3>Commitments</h3>
        <div className="stack">
          {commitments.map((item) => (
            <div key={item.id} className="card blocker-row">
              <strong>{item.title}</strong>
              <span className="small muted">{item.task_id} · {item.decision_id}</span>
              <select value={item.status} onChange={(e) => setStatus(item.id, e.target.value as Commitment["status"])}>
                <option value="committed">committed</option>
                <option value="in_progress">in_progress</option>
                <option value="blocked">blocked</option>
                <option value="done">done</option>
              </select>
            </div>
          ))}
          {!commitments.length ? <p className="small muted">No commitments yet.</p> : null}
        </div>
      </article>
    </section>
  );
}
