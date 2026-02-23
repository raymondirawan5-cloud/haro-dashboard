import { NextResponse } from "next/server";
import { getAdjacencyList } from "@/lib/graph-store";

export async function GET() {
  try {
    return NextResponse.json(getAdjacencyList());
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "failed to load graph" },
      { status: 500 },
    );
  }
}
