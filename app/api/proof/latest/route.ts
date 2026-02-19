import { NextResponse } from "next/server";
import { PROOF_PATH, readProofLatest } from "@/lib/mission-control-store";

export async function GET() {
  const proof = readProofLatest();
  return NextResponse.json({ proof_path: PROOF_PATH, ...proof });
}
