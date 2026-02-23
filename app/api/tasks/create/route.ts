import { NextResponse } from "next/server";
import { readDecisionsIndex, readTasks, writeTasks } from "@/lib/mission-control-store";
import { syncTaskCreated } from "@/lib/graph-store";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const title = typeof body?.title === "string" ? body.title.trim() : "";
    const decisionId = typeof body?.decision_id === "string" ? body.decision_id.trim() : "";
    const status = body?.status;

    if (!title || !decisionId) {
      return NextResponse.json({ error: "title and decision_id are required" }, { status: 400 });
    }
    if (status && !["pending", "active", "blocked", "complete"].includes(status)) {
      return NextResponse.json({ error: "invalid status" }, { status: 400 });
    }

    const decisions = readDecisionsIndex();
    if (!decisions.has(decisionId)) {
      return NextResponse.json({ error: "decision_id not found" }, { status: 400 });
    }

    const tasksFile = readTasks();
    const now = new Date().toISOString();
    const task = {
      id: `task-${Date.now()}`,
      title,
      status: (status || "pending") as "pending" | "active" | "blocked" | "complete",
      decision_id: decisionId,
      proof_id: null,
      created_at: now,
      updated_at: now,
    };

    const saved = writeTasks({ ...tasksFile, tasks: [...tasksFile.tasks, task], updated_at: now });
    try {
      syncTaskCreated(task);
    } catch (error) {
      console.error("graph sync failed (task create)", error);
    }
    return NextResponse.json({ task, ...saved }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }
}
