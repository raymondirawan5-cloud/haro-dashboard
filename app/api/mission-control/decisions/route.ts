import { NextResponse } from "next/server";
import {
  PROJECT_DECISIONS_PATH,
  SUPPORTED_PROJECT,
  readOrBootstrapProjectDecisions,
  updateDecision,
} from "@/lib/mission-control-decisions";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const project = searchParams.get("project") || "";

  if (project !== SUPPORTED_PROJECT) {
    return NextResponse.json(
      { error: `project must be ${SUPPORTED_PROJECT}` },
      { status: 400 },
    );
  }

  try {
    const data = readOrBootstrapProjectDecisions(project);
    return NextResponse.json({ decisionsPath: PROJECT_DECISIONS_PATH, ...data });
  } catch {
    return NextResponse.json({ error: "failed to read decisions" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const project = typeof body?.project === "string" ? body.project.trim() : "";
    const id = typeof body?.id === "string" ? body.id.trim() : "";

    if (project !== SUPPORTED_PROJECT) {
      return NextResponse.json(
        { error: `project must be ${SUPPORTED_PROJECT}` },
        { status: 400 },
      );
    }

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const result = updateDecision({
      project,
      id,
      choice: typeof body?.choice === "string" ? body.choice : undefined,
      status: typeof body?.status === "string" ? body.status : undefined,
      approvedBy: typeof body?.approvedBy === "string" ? body.approvedBy : undefined,
      approvedAt: typeof body?.approvedAt === "string" ? body.approvedAt : undefined,
    });

    if (!result) {
      return NextResponse.json({ error: "decision not found" }, { status: 404 });
    }

    return NextResponse.json({ decisionsPath: PROJECT_DECISIONS_PATH, ...result.data, decision: result.decision });
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }
}
