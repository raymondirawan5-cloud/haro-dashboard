import { NextResponse } from "next/server";
import { readDecisionsIndex, readTasks, writeTasks } from "@/lib/mission-control-store";

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const id = typeof body?.id === "string" ? body.id.trim() : "";
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const tasksFile = readTasks();
    const idx = tasksFile.tasks.findIndex((task) => task.id === id);
    if (idx < 0) return NextResponse.json({ error: "task not found" }, { status: 404 });

    const current = tasksFile.tasks[idx];
    const title = typeof body?.title === "string" && body.title.trim() ? body.title.trim() : current.title;
    const status = ["pending", "active", "blocked", "complete"].includes(body?.status) ? body.status : current.status;
    const decisionId = typeof body?.decision_id === "string" && body.decision_id.trim() ? body.decision_id.trim() : current.decision_id;

    const decisions = readDecisionsIndex();
    if (!decisions.has(decisionId)) {
      return NextResponse.json({ error: "decision_id not found" }, { status: 400 });
    }

    const next = {
      ...current,
      title,
      status,
      decision_id: decisionId,
      proof_id: typeof body?.proof_id === "string" ? body.proof_id : current.proof_id,
      updated_at: new Date().toISOString(),
    };

    const tasks = [...tasksFile.tasks];
    tasks[idx] = next;
    const saved = writeTasks({ ...tasksFile, tasks, updated_at: new Date().toISOString() });
    return NextResponse.json({ task: next, ...saved });
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }
}
