import { NextResponse } from "next/server";
import { readToday, writeToday } from "@/lib/mission-control-store";

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const id = typeof body?.id === "string" ? body.id.trim() : "";
    const status = body?.status;
    const proofId = typeof body?.proof_id === "string" ? body.proof_id : null;

    if (!id || !["committed", "in_progress", "blocked", "done"].includes(status)) {
      return NextResponse.json({ error: "id and valid status are required" }, { status: 400 });
    }

    const today = readToday();
    const idx = today.commitments.findIndex((c) => c.id === id);
    if (idx < 0) return NextResponse.json({ error: "commitment not found" }, { status: 404 });

    const next = [...today.commitments];
    next[idx] = { ...next[idx], status, proof_id: proofId };
    const saved = writeToday({ ...today, commitments: next });

    return NextResponse.json({ commitment: next[idx], ...saved });
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }
}
