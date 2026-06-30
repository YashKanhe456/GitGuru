import { NextResponse } from "next/server";
import { listRecentAnalyses } from "@/lib/db";

export async function GET() {
  try {
    const result = await listRecentAnalyses();
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "RepoMind could not load recent analyses.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
