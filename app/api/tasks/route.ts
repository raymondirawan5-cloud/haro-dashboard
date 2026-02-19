import { NextResponse } from "next/server";
import { TASKS_PATH, readTasks } from "@/lib/mission-control-store";

export async function GET() {
  const data = readTasks();
  return NextResponse.json({ tasks_path: TASKS_PATH, ...data });
}
