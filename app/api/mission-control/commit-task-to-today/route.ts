import { NextResponse } from "next/server";
import { readTasks, readToday, writeToday } from "@/lib/mission-control-store";
import { syncCommitmentCreated } from "@/lib/graph-store";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const taskId = typeof body?.task_id === "string" ? body.task_id.trim() : "";

    if (!taskId) {
      return NextResponse.json({ error: "task_id is required" }, { status: 400 });
    }

    const tasks = readTasks();
    const task = tasks.tasks.find((item) => item.id === taskId);
    if (!task) {
      return NextResponse.json({ error: "task not found" }, { status: 404 });
    }

    const today = readToday();
    const duplicate = today.commitments.some((item) => item.task_id === taskId);
    if (duplicate) {
      return NextResponse.json({ error: "task already committed today" }, { status: 409 });
    }

    const commitment = {
      id: `commitment-${Date.now()}`,
      task_id: task.id,
      decision_id: task.decision_id,
      title: task.title,
      status: "committed" as const,
      proof_required: true,
      proof_id: null,
      created_at: new Date().toISOString(),
      last_updated_at: new Date().toISOString(),
    };

    const saved = writeToday({ ...today, commitments: [...today.commitments, commitment] });
    try {
      syncCommitmentCreated(commitment);
    } catch (error) {
      console.error("graph sync failed (commit-task-to-today)", error);
    }
    return NextResponse.json({ commitment, ...saved }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }
}
