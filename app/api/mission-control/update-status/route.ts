import { NextResponse } from "next/server";
import { getProofReferenceForTask, readToday, writeToday } from "@/lib/mission-control-store";

const allowedTransitions: Record<string, string[]> = {
  committed: ["in_progress"],
  in_progress: ["blocked", "done"],
  blocked: ["in_progress"],
  done: [],
};

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const id = typeof body?.id === "string" ? body.id.trim() : "";
    const status = body?.status;

    if (!id || !["committed", "in_progress", "blocked", "done"].includes(status)) {
      return NextResponse.json({ error: "id and valid status are required" }, { status: 400 });
    }

    const today = readToday();
    const idx = today.commitments.findIndex((c) => c.id === id);
    if (idx < 0) return NextResponse.json({ error: "commitment not found" }, { status: 404 });

    const current = today.commitments[idx];
    const canTransition = allowedTransitions[current.status]?.includes(status);
    if (!canTransition) {
      return NextResponse.json(
        { error: `invalid transition: ${current.status} -> ${status}` },
        { status: 409 },
      );
    }

    const proofId =
      status === "done"
        ? getProofReferenceForTask(current.task_id) || current.proof_id
        : current.proof_id;

    const nextCommitment = { ...current, status, proof_id: proofId ?? null };
    const next = [...today.commitments];
    next[idx] = nextCommitment;
    const saved = writeToday({ ...today, commitments: next });

    return NextResponse.json({ commitment: nextCommitment, ...saved });
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }
}
