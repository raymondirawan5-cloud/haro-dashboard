import { NextResponse } from "next/server";
import { analyzeCommitments } from "@/lib/commitment-health";
import { readProofLatest, readTasks, readToday } from "@/lib/mission-control-store";

export async function GET() {
  try {
    const today = readToday();
    const tasks = readTasks();
    const proof = readProofLatest();

    const analyzed = analyzeCommitments(today, tasks.tasks, proof);
    const { at_risk, done_unverified } = analyzed.counts;

    const status = done_unverified > 0 ? "critical" : at_risk > 0 ? "warning" : "healthy";

    return NextResponse.json({
      status,
      summary: analyzed.counts,
      commitments: analyzed.commitments,
    });
  } catch {
    return NextResponse.json({ error: "failed to compute mission control health" }, { status: 500 });
  }
}
