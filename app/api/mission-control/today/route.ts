import { NextResponse } from "next/server";
import { TODAY_PATH, readToday } from "@/lib/mission-control-store";

export async function GET() {
  try {
    const data = readToday();
    return NextResponse.json({ today_path: TODAY_PATH, ...data });
  } catch {
    return NextResponse.json({ error: "failed to read today" }, { status: 500 });
  }
}
