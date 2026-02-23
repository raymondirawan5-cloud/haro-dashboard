import { NextResponse } from "next/server";
import { convertInsightToAction } from "@/lib/brain-store";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const insightId = String(body?.insight_id || "").trim();
    if (!insightId) {
      return NextResponse.json({ error: "insight_id is required" }, { status: 400 });
    }

    const result = convertInsightToAction(insightId);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "invalid request" }, { status: 400 });
  }
}
