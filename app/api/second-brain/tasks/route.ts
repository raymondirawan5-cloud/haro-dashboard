import { NextResponse } from "next/server";
import { readTasksRaw, TASKS_PATH } from "@/lib/second-brain";

export async function GET() {
  const data = readTasksRaw();
  return NextResponse.json({ tasksPath: TASKS_PATH, ...data });
}
