"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import MissionKanbanBoard from "@/components/MissionKanbanBoard";
import OperatorButton from "@/components/ui/OperatorButton";
import { apiUrl } from "@/lib/client-api-base";
import type { Commitment, HealthResponse, HealthSummary, Proof } from "@/lib/mission-control-types";

const DEFAULT_SUMMARY: HealthSummary = {
  healthy: 0,
  at_risk: 0,
  blocked: 0,
  done_verified: 0,
  done_unverified: 0,
};

const FOCUS_MODE_KEY = "mission-control-focus-mode";
const MissionExecutionGraph = dynamic(() => import("@/components/MissionExecutionGraph"), { ssr: false });

function formatDateLabel(date: Date) {
  return `${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`;
}

export default function DashboardPage() {
  const [date, setDate] = useState("");
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [proof, setProof] = useState<Proof>({ generated_at: "", task_proofs: [], commits: [], deployments: [] });
  const [healthStatus, setHealthStatus] = useState<HealthResponse["status"]>("healthy");
  const [healthSummary, setHealthSummary] = useState<HealthSummary>(DEFAULT_SUMMARY);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [focusMode, setFocusMode] = useState(false);

  const loadAll = useCallback(async () => {
    const [todayRes, proofRes, healthRes] = await Promise.all([
      fetch(apiUrl("/api/mission-control/today")),
      fetch(apiUrl("/api/proof/latest")),
      fetch(apiUrl("/api/mission-control/health")),
    ]);

    if (!todayRes.ok || !proofRes.ok || !healthRes.ok) throw new Error("failed loading dashboard data");

    const todayData = await todayRes.json();
    const proofData = await proofRes.json();
    const healthData = (await healthRes.json()) as HealthResponse;

    setDate(typeof todayData.date === "string" ? todayData.date : "");
    setCommitments(Array.isArray(healthData.commitments) ? healthData.commitments : []);
    setProof(proofData as Proof);
    setHealthStatus(["healthy", "warning", "critical"].includes(healthData.status) ? healthData.status : "healthy");
    setHealthSummary(healthData.summary || DEFAULT_SUMMARY);
  }, []);

  useEffect(() => {
    const stored = window.localStorage.getItem(FOCUS_MODE_KEY);
    setFocusMode(stored === "on");
    loadAll().catch(() => setFeedback("Failed to load mission control dashboard."));
  }, [loadAll]);

  const toggleFocusMode = useCallback(() => {
    setFocusMode((prev) => {
      const next = !prev;
      window.localStorage.setItem(FOCUS_MODE_KEY, next ? "on" : "off");
      return next;
    });
  }, []);

  const executionSeries = useMemo(() => {
    const todayCounts = {
      committed: commitments.filter((c) => c.status === "committed").length,
      completed_verified: commitments.filter((c) => c.health_status === "done_verified").length,
      completed_unverified: commitments.filter((c) => c.health_status === "done_unverified").length,
      blocked: commitments.filter((c) => c.status === "blocked").length,
    };

    return Array.from({ length: 7 }).map((_, index) => {
      const day = new Date();
      day.setDate(day.getDate() - (6 - index));
      const isToday = index === 6;
      return {
        date: formatDateLabel(day),
        committed: isToday ? todayCounts.committed : 0,
        completed_verified: isToday ? todayCounts.completed_verified : 0,
        completed_unverified: isToday ? todayCounts.completed_unverified : 0,
        blocked: isToday ? todayCounts.blocked : 0,
      };
    });
  }, [commitments]);

  return (
    <section>
      <div className="decision-header">
        <div>
          <h2>Mission Control</h2>
          <p className="muted small">Date: {date || "-"}</p>
        </div>
        <div className="inline-actions">
          <OperatorButton variant="ghost" onClick={toggleFocusMode}>Focus Mode: {focusMode ? "ON" : "OFF"}</OperatorButton>
          <Link href="/dashboard/graph" className="nav-link">Graph</Link>
          <Link href="/dashboard/kanban" className="nav-link active">Open Full Kanban</Link>
        </div>
      </div>

      {feedback ? <p className="muted">{feedback}</p> : null}

      <article className="panel ambient-edge">
        <h3>Health Indicator <span className="badge">{healthStatus.toUpperCase()}</span></h3>
        <p className="small muted">
          Healthy: {healthSummary.healthy} · At Risk: {healthSummary.at_risk} · Blocked: {healthSummary.blocked} · Done Verified: {healthSummary.done_verified} · Done Unverified: {healthSummary.done_unverified}
        </p>
      </article>

      <article className="ambient-edge">
        <h3>Kanban Board</h3>
        <MissionKanbanBoard
          commitments={commitments}
          focusMode={focusMode}
          onUpdated={loadAll}
          onError={(msg) => setFeedback(msg)}
        />
      </article>

      {!focusMode ? (
        <>
          <article className="panel ambient-edge">
            <h3>Execution Graph</h3>
            <MissionExecutionGraph data={executionSeries} />
          </article>

          <article className="panel ambient-edge">
            <h3>Latest Proof</h3>
            <p className="muted small">generated_at: {proof.generated_at || "-"}</p>
            <p className="small muted">commits: {proof.commits.length} · deployments: {proof.deployments.length}</p>
          </article>
        </>
      ) : null}
    </section>
  );
}
