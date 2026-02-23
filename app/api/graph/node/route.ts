import { NextResponse } from "next/server";
import { NODE_TYPES, createNode } from "@/lib/graph-store";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const id = typeof body?.id === "string" ? body.id.trim() : "";
    const type = body?.type;
    const title = typeof body?.title === "string" ? body.title : "";
    const refPath = typeof body?.ref_path === "string" ? body.ref_path : "";

    if (!id || !title || !refPath) {
      return NextResponse.json({ error: "id, type, title, ref_path are required" }, { status: 400 });
    }

    if (!(NODE_TYPES as readonly string[]).includes(type)) {
      return NextResponse.json({ error: "invalid node type" }, { status: 400 });
    }

    const node = createNode({
      id,
      type,
      title,
      ref_path: refPath,
      created_at: new Date().toISOString(),
      metadata: body?.metadata && typeof body.metadata === "object" ? body.metadata : {},
    });

    return NextResponse.json({ node }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "invalid request" },
      { status: 400 },
    );
  }
}
