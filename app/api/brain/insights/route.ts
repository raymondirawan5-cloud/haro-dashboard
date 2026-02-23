import { NextResponse } from "next/server";
import { createInsight } from "@/lib/brain-store";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const node = createInsight({
      title: String(body?.title || ""),
      source_type: String(body?.source_type || "other"),
      source_title: String(body?.source_title || ""),
      source_reference: body?.source_reference ? String(body.source_reference) : undefined,
      category: body?.category ? String(body.category) : undefined,
      actionable: body?.actionable !== false,
      linked_ambition_id: body?.linked_ambition_id ? String(body.linked_ambition_id) : undefined,
    });
    return NextResponse.json({ node }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "invalid request" }, { status: 400 });
  }
}
