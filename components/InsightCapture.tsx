"use client";

import { useState } from "react";

type Ambition = { id: string; title: string };

type Insight = {
  id: string;
  title: string;
  metadata: Record<string, unknown>;
  unanchored?: boolean;
};

export default function InsightCapture({
  ambitions,
  insights,
  onCreate,
  onConvert,
}: {
  ambitions: Ambition[];
  insights: Insight[];
  onCreate: (payload: {
    title: string;
    source_type: string;
    source_title: string;
    linked_ambition_id?: string;
    actionable: boolean;
  }) => Promise<void>;
  onConvert: (insightId: string) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [sourceTitle, setSourceTitle] = useState("");
  const [sourceType, setSourceType] = useState("other");
  const [ambitionId, setAmbitionId] = useState("");
  const [actionable, setActionable] = useState(true);

  return (
    <article className="panel ambient-edge">
      <h3>Insight Capture</h3>
      <div style={{ display: "grid", gap: 8 }}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Atomic insight (<200 chars)" />
        <input value={sourceTitle} onChange={(e) => setSourceTitle(e.target.value)} placeholder="Source title" />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <select value={sourceType} onChange={(e) => setSourceType(e.target.value)}>
            <option value="other">other</option>
            <option value="podcast">podcast</option>
            <option value="book">book</option>
            <option value="article">article</option>
            <option value="conversation">conversation</option>
          </select>
          <select value={ambitionId} onChange={(e) => setAmbitionId(e.target.value)}>
            <option value="">No ambition link</option>
            {ambitions.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}
          </select>
          <label className="small muted" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input type="checkbox" checked={actionable} onChange={(e) => setActionable(e.target.checked)} /> actionable
          </label>
          <button
            className="nav-link"
            onClick={async () => {
              await onCreate({ title, source_title: sourceTitle, source_type: sourceType, linked_ambition_id: ambitionId || undefined, actionable });
              setTitle("");
              setSourceTitle("");
            }}
          >
            Save Insight
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gap: 6, marginTop: 10 }}>
        {insights.map((insight) => {
          const canConvert = insight.metadata.actionable === true;
          return (
            <div key={insight.id} className="small" style={{ border: "1px solid #1f2937", borderRadius: 10, padding: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <span>{insight.title}</span>
                <span className="muted">{String(insight.metadata.source_type || "other")}</span>
              </div>
              {insight.unanchored ? <span className="badge">Unanchored</span> : null}
              {canConvert ? (
                <div style={{ marginTop: 6 }}>
                  <button className="nav-link" onClick={() => onConvert(insight.id)}>Convert to Action</button>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </article>
  );
}
