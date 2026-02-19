import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { MISSION_CONTROL_HISTORY_DIR, TODAY_PATH, readToday, writeToday } from "@/lib/mission-control-store";

export async function POST() {
  try {
    const today = readToday();
    const dateKey = typeof today.date === "string" && today.date ? today.date : new Date().toISOString().slice(0, 10);

    fs.mkdirSync(MISSION_CONTROL_HISTORY_DIR, { recursive: true });
    const archivePath = path.join(MISSION_CONTROL_HISTORY_DIR, `${dateKey}.json`);
    fs.writeFileSync(archivePath, `${JSON.stringify(today, null, 2)}\n`, "utf8");

    const reset = writeToday({ date: new Date().toISOString().slice(0, 10), commitments: [] });
    return NextResponse.json({ archived_to: archivePath, today_path: TODAY_PATH, ...reset });
  } catch {
    return NextResponse.json({ error: "failed to reset day" }, { status: 500 });
  }
}
