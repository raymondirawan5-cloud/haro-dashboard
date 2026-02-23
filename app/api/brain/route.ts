import { NextResponse } from "next/server";
import { listBrainState } from "@/lib/brain-store";

export async function GET() {
  try {
    return NextResponse.json(listBrainState());
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "failed" }, { status: 500 });
  }
}
