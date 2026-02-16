import { NextResponse } from "next/server";
import { listMemories } from "@/lib/second-brain";

export async function GET() {
  const items = listMemories();
  return NextResponse.json({ count: items.length, items });
}
