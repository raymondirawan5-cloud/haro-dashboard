import { NextResponse } from "next/server";
import { createTask, readTasksRaw, TASKS_PATH, updateTask } from "@/lib/second-brain";

export async function GET() {
  const data = readTasksRaw();
  return NextResponse.json({ tasksPath: TASKS_PATH, ...data });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const title = typeof body?.title === "string" ? body.title.trim() : "";
    const details = typeof body?.details === "string" ? body.details : undefined;
    const status = typeof body?.status === "string" ? body.status : undefined;

    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    const created = createTask({ title, details, status });
    return NextResponse.json({ tasksPath: TASKS_PATH, ...created.data, card: created.card }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const id = typeof body?.id === "string" ? body.id.trim() : "";

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const result = updateTask({
      id,
      title: typeof body?.title === "string" ? body.title : undefined,
      status: typeof body?.status === "string" ? body.status : undefined,
      dueDate:
        body?.dueDate === null || typeof body?.dueDate === "string" ? body.dueDate : undefined,
    });

    if (!result) {
      return NextResponse.json({ error: "task not found" }, { status: 404 });
    }

    return NextResponse.json({ tasksPath: TASKS_PATH, ...result.data, card: result.card });
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }
}
