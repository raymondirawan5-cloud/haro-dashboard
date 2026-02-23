import { NextResponse } from "next/server";
import { createExperience, updateExperienceStatus } from "@/lib/brain-store";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const node = createExperience({
      title: String(body?.title || ""),
      category: String(body?.category || "other"),
      priority: body?.priority ? String(body.priority) : undefined,
      status: body?.status ? String(body.status) : undefined,
      linked_ambition_id: body?.linked_ambition_id ? String(body.linked_ambition_id) : undefined,
    });
    return NextResponse.json({ node }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "invalid request" }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const node = updateExperienceStatus(String(body?.id || ""), String(body?.status || ""));
    return NextResponse.json({ node });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "invalid request" }, { status: 400 });
  }
}
