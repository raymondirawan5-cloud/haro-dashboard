import { NextResponse } from "next/server";
import { listDocuments } from "@/lib/second-brain";

export async function GET() {
  const items = listDocuments(process.cwd());
  return NextResponse.json({ count: items.length, items });
}
