import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { runAnalysisGraph } from "@/lib/analysis/graph";
import { saveAnalysis } from "@/lib/db";

const requestSchema = z.object({
  repoUrl: z.string().url(),
});

export async function POST(request: NextRequest) {
  try {
    const body = requestSchema.parse(await request.json());
    const { snapshot, report } = await runAnalysisGraph(body);
    const saved = await saveAnalysis(snapshot, report);

    return NextResponse.json({
      id: saved.id,
      snapshot,
      report,
      savedToDatabase: saved.savedToDatabase,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "RepoMind could not analyze this repository.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
