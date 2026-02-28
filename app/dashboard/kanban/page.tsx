"use client";

import { useCallback, useEffect, useState } from "react";
import OperatorButton from "@/components/ui/OperatorButton";
import MissionKanbanBoard from "@/components/MissionKanbanBoard";
import { useToast } from "@/components/ui/Toast";
import { apiUrl } from "@/lib/client-api-base";
import type { Commitment, HealthResponse } from "@/lib/mission-control-types";

const FOCUS_MODE_KEY = "mission-control-focus-mode";

export default function DashboardKanbanPage() {
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [focusMode, setFocusMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const loadCommitments = useCallback(async () => {
    try {
      const res = await fetch(apiUrl("/api/mission-control/health"));
      if (!res.ok) throw new Error("failed");
      const data = (await res.json()) as HealthResponse;
      setCommitments(Array.isArray(data.commitments) ? data.commitments : []);
    } catch {
      showToast("Failed to load kanban.", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    setFocusMode(window.localStorage.getItem(FOCUS_MODE_KEY) === "on");
    loadCommitments().catch(() => setLoading(false));
  }, [loadCommitments]);

  const toggleFocusMode = useCallback(() => {
    setFocusMode((prev) => {
      const next = !prev;
      window.localStorage.setItem(FOCUS_MODE_KEY, next ? "on" : "off");
      showToast(`Focus mode ${next ? "enabled" : "disabled"}.`, "info");
      return next;
    });
  }, [showToast]);

  const handleError = useCallback((message: string) => {
    showToast(message, "error");
  }, [showToast]);

  const handleUpdated = useCallback(async () => {
    await loadCommitments();
    showToast("Board updated.", "success");
  }, [loadCommitments, showToast]);

  return (
    <section className="animate-fade-in">
      <div className="decision-header" style={{ marginBottom: 16 }}>
        <div>
          <h2>Mission Kanban</h2>
          <p className="muted small">Drag cards between columns to update status.</p>
        </div>
        <OperatorButton variant="ghost" onClick={toggleFocusMode}>
          Focus Mode: {focusMode ? "ON" : "OFF"}
        </OperatorButton>
      </div>

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="panel" style={{ minHeight: 200 }}>
              <div className="skeleton" style={{ height: 24, marginBottom: 12 }} />
              <div className="skeleton" style={{ height: 80 }} />
            </div>
          ))}
        </div>
      ) : (
        <MissionKanbanBoard
          commitments={commitments}
          focusMode={focusMode}
          onUpdated={handleUpdated}
          onError={handleError}
        />
      )}
    </section>
  );
}
