import { NextResponse } from "next/server";
import { RELATION_TYPES, createEdge } from "@/lib/graph-store";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const from = typeof body?.from === "string" ? body.from.trim() : "";
    const to = typeof body?.to === "string" ? body.to.trim() : "";
    const relation = body?.relation;

    if (!from || !to || !relation) {
      return NextResponse.json({ error: "from, to, relation are required" }, { status: 400 });
    }

    if (!(RELATION_TYPES as readonly string[]).includes(relation)) {
      return NextResponse.json({ error: "invalid relation type" }, { status: 400 });
    }

    const edge = createEdge({
      id: "",
      from,
      to,
      relation,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ edge }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "invalid request" },
      { status: 400 },
    );
  }
}
