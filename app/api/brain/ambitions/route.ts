import { NextResponse } from "next/server";
import { createAmbition } from "@/lib/brain-store";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const node = createAmbition({
      title: String(body?.title || ""),
      domain: String(body?.domain || ""),
      horizon: String(body?.horizon || ""),
      status: body?.status ? String(body.status) : undefined,
    });
    return NextResponse.json({ node }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "invalid request" }, { status: 400 });
  }
}
