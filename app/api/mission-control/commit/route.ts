import { NextResponse } from "next/server";
import { readToday, writeToday } from "@/lib/mission-control-store";
import { syncCommitmentCreated } from "@/lib/graph-store";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const title = typeof body?.title === "string" ? body.title.trim() : "";
    const taskId = typeof body?.task_id === "string" ? body.task_id.trim() : "";
    const decisionId = typeof body?.decision_id === "string" ? body.decision_id.trim() : "";

    if (!title || !taskId || !decisionId) {
      return NextResponse.json({ error: "title, task_id, decision_id are required" }, { status: 400 });
    }

    const today = readToday();
    const commitment = {
      id: `c-${Date.now()}`,
      title,
      task_id: taskId,
      decision_id: decisionId,
      status: "committed" as const,
      proof_required: body?.proof_required !== false,
      proof_id: null,
      created_at: new Date().toISOString(),
    };

    const saved = writeToday({ ...today, commitments: [...today.commitments, commitment] });
    try {
      syncCommitmentCreated(commitment);
    } catch (error) {
      console.error("graph sync failed (commitment create)", error);
    }
    return NextResponse.json({ commitment, ...saved }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }
}
