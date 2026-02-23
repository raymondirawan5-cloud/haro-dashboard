"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiUrl } from "@/lib/client-api-base";
import AmbitionPanel from "@/components/AmbitionPanel";
import ExperienceQueue from "@/components/ExperienceQueue";
import InsightCapture from "@/components/InsightCapture";
import ConversionLog from "@/components/ConversionLog";

type NodeItem = { id: string; title: string; type: string; metadata: Record<string, unknown>; unanchored?: boolean; stale?: boolean };
type BrainState = {
  ambitions: NodeItem[];
  experiences: NodeItem[];
  insights: NodeItem[];
  conversionLog: Array<{ id: string; relation: string; created_at: string; from: { id: string; title?: string; type?: string }; to: { id: string; title?: string; type?: string } }>;
};

export default function BrainPage() {
  const [data, setData] = useState<BrainState>({ ambitions: [], experiences: [], insights: [], conversionLog: [] });
  const [selectedAmbitionId, setSelectedAmbitionId] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(apiUrl("/api/brain"));
    if (!res.ok) throw new Error("failed to load brain data");
    setData((await res.json()) as BrainState);
  }, []);

  useEffect(() => {
    load().catch((e) => setFeedback(e instanceof Error ? e.message : "failed"));
  }, [load]);

  const filteredExperiences = useMemo(() => {
    if (!selectedAmbitionId) return data.experiences;
    return data.experiences.filter((item) => item.metadata.linked_ambition_id === selectedAmbitionId);
  }, [data.experiences, selectedAmbitionId]);

  const filteredInsights = useMemo(() => {
    if (!selectedAmbitionId) return data.insights;
    return data.insights.filter((item) => item.metadata.linked_ambition_id === selectedAmbitionId);
  }, [data.insights, selectedAmbitionId]);

  return (
    <section style={{ background: "#070709", borderRadius: 16, padding: 12 }}>
      <div className="decision-header">
        <div>
          <h2>Second Brain HQ</h2>
          <p className="muted small">Ambitions · Experiences · Insights · Actions · Proof</p>
        </div>
        <div className="inline-actions">
          <Link href="/dashboard" className="nav-link">Dashboard</Link>
          <Link href="/dashboard/graph" className="nav-link">Graph</Link>
        </div>
      </div>

      {feedback ? <p className="muted small">{feedback}</p> : null}

      <div style={{ display: "grid", gap: 12 }}>
        <AmbitionPanel ambitions={data.ambitions} selectedAmbitionId={selectedAmbitionId} onSelect={setSelectedAmbitionId} />

        <ExperienceQueue
          experiences={filteredExperiences}
          onStatus={async (id, status) => {
            const res = await fetch(apiUrl("/api/brain/experiences"), {
              method: "PATCH",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ id, status }),
            });
            if (!res.ok) throw new Error("failed to update experience");
            await load();
          }}
        />

        <InsightCapture
          ambitions={data.ambitions}
          insights={filteredInsights}
          onCreate={async (payload) => {
            const res = await fetch(apiUrl("/api/brain/insights"), {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error("failed to save insight");
            await load();
          }}
          onConvert={async (insightId) => {
            const res = await fetch(apiUrl("/api/brain/insights/convert"), {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ insight_id: insightId }),
            });
            if (!res.ok) throw new Error("failed to convert insight");
            await load();
          }}
        />

        <ConversionLog logs={data.conversionLog} />
      </div>
    </section>
  );
}
