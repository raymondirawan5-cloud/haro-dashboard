"use client";

import { useCallback, useEffect, useState } from "react";
import OperatorButton from "@/components/ui/OperatorButton";
import MissionKanbanBoard from "@/components/MissionKanbanBoard";
import { apiUrl } from "@/lib/client-api-base";
import type { Commitment, HealthResponse } from "@/lib/mission-control-types";

const FOCUS_MODE_KEY = "mission-control-focus-mode";

export default function DashboardKanbanPage() {
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [focusMode, setFocusMode] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadCommitments = useCallback(async () => {
    const res = await fetch(apiUrl("/api/mission-control/health"));
    if (!res.ok) throw new Error("failed");
    const data = (await res.json()) as HealthResponse;
    setCommitments(Array.isArray(data.commitments) ? data.commitments : []);
  }, []);

  useEffect(() => {
    setFocusMode(window.localStorage.getItem(FOCUS_MODE_KEY) === "on");
    loadCommitments().catch(() => setFeedback("Failed to load kanban."));
  }, [loadCommitments]);

  const toggleFocusMode = useCallback(() => {
    setFocusMode((prev) => {
      const next = !prev;
      window.localStorage.setItem(FOCUS_MODE_KEY, next ? "on" : "off");
      return next;
    });
  }, []);

  return (
    <section>
      <div className="decision-header">
        <h2>Mission Kanban</h2>
        <OperatorButton variant="ghost" onClick={toggleFocusMode}>Focus Mode: {focusMode ? "ON" : "OFF"}</OperatorButton>
      </div>
      {feedback ? <p className="muted">{feedback}</p> : null}
      <MissionKanbanBoard commitments={commitments} focusMode={focusMode} onUpdated={loadCommitments} onError={setFeedback} />
    </section>
  );
}
