"use client";

import { useEffect, useState } from "react";
import { apiUrl } from "@/lib/client-api-base";

type Blocker = {
  id: string;
  text: string;
  owner: "ray" | "haro" | "shared";
  due: string;
};

type TodayData = {
  updatedAt: string | null;
  rayNext90: { task: string; notes?: string };
  haroNext90: { task: string; notes?: string };
  blockers: Blocker[];
};

const EMPTY: TodayData = {
  updatedAt: null,
  rayNext90: { task: "", notes: "" },
  haroNext90: { task: "", notes: "" },
  blockers: [],
};

export default function MissionControlTodayPage() {
  const [data, setData] = useState<TodayData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    fetch(apiUrl("/api/mission-control/today"))
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((payload) => {
        setData({
          updatedAt: payload.updatedAt ?? null,
          rayNext90: payload.rayNext90 ?? EMPTY.rayNext90,
          haroNext90: payload.haroNext90 ?? EMPTY.haroNext90,
          blockers: Array.isArray(payload.blockers) ? payload.blockers : [],
        });
      })
      .catch(() => setFeedback("Unable to load today plan."))
      .finally(() => setLoading(false));
  }, []);

  function updateBlocker(index: number, patch: Partial<Blocker>) {
    setData((prev) => ({
      ...prev,
      blockers: prev.blockers.map((blocker, i) => (i === index ? { ...blocker, ...patch } : blocker)),
    }));
  }

  function addBlocker() {
    setData((prev) => ({
      ...prev,
      blockers: [
        ...prev.blockers,
        { id: `b${Date.now()}`, text: "", owner: "shared", due: new Date().toISOString().slice(0, 10) },
      ],
    }));
  }

  function removeBlocker(index: number) {
    setData((prev) => ({
      ...prev,
      blockers: prev.blockers.filter((_, i) => i !== index),
    }));
  }

  async function save() {
    setSaving(true);
    setFeedback(null);
    try {
      const response = await fetch(apiUrl("/api/mission-control/today"), {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("save failed");
      const payload = await response.json();
      setData({
        updatedAt: payload.updatedAt ?? null,
        rayNext90: payload.rayNext90 ?? EMPTY.rayNext90,
        haroNext90: payload.haroNext90 ?? EMPTY.haroNext90,
        blockers: Array.isArray(payload.blockers) ? payload.blockers : [],
      });
      setFeedback("Saved today command plan.");
    } catch {
      setFeedback("Save failed. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section>
      <h2>Mission Control · Today</h2>
      <p className="muted">Single-screen command view for the next 90 minutes.</p>
      {loading ? <p className="muted">Loading today view...</p> : null}
      {feedback ? <p className="muted">{feedback}</p> : null}

      <div className="grid two">
        <article className="panel">
          <h3>Ray · Next 90 min</h3>
          <textarea
            rows={3}
            value={data.rayNext90.task}
            onChange={(e) => setData((prev) => ({ ...prev, rayNext90: { ...prev.rayNext90, task: e.target.value } }))}
            placeholder="Primary task for Ray"
          />
          <input
            value={data.rayNext90.notes || ""}
            onChange={(e) => setData((prev) => ({ ...prev, rayNext90: { ...prev.rayNext90, notes: e.target.value } }))}
            placeholder="Optional notes"
          />
        </article>

        <article className="panel">
          <h3>Haro · Next 90 min</h3>
          <textarea
            rows={3}
            value={data.haroNext90.task}
            onChange={(e) => setData((prev) => ({ ...prev, haroNext90: { ...prev.haroNext90, task: e.target.value } }))}
            placeholder="Primary task for Haro"
          />
          <input
            value={data.haroNext90.notes || ""}
            onChange={(e) => setData((prev) => ({ ...prev, haroNext90: { ...prev.haroNext90, notes: e.target.value } }))}
            placeholder="Optional notes"
          />
        </article>
      </div>

      <article className="panel" style={{ marginTop: 12 }}>
        <div className="decision-header">
          <h3>Blockers</h3>
          <button type="button" onClick={addBlocker} className="ghost-btn">
            + Add blocker
          </button>
        </div>
        <div className="stack">
          {data.blockers.map((blocker, idx) => (
            <div key={blocker.id || `blocker-${idx}`} className="card blocker-row">
              <input
                value={blocker.text}
                onChange={(e) => updateBlocker(idx, { text: e.target.value })}
                placeholder="Blocker"
              />
              <select value={blocker.owner} onChange={(e) => updateBlocker(idx, { owner: e.target.value as Blocker["owner"] })}>
                <option value="ray">Ray</option>
                <option value="haro">Haro</option>
                <option value="shared">Shared</option>
              </select>
              <input type="date" value={blocker.due} onChange={(e) => updateBlocker(idx, { due: e.target.value })} />
              <button type="button" className="ghost-btn" onClick={() => removeBlocker(idx)}>
                Remove
              </button>
            </div>
          ))}
          {!data.blockers.length ? <p className="muted small">No blockers listed.</p> : null}
        </div>
      </article>

      <div className="inline-actions">
        <button type="button" onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save today plan"}
        </button>
        <p className="muted small">Last update: {data.updatedAt || "not saved yet"}</p>
      </div>
    </section>
  );
}
