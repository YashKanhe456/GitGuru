import { NextRequest, NextResponse } from "next/server";
import type { AnalysisReport } from "@/lib/analysis/types";
import { getAnalysisById } from "@/lib/db";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const analysis = await getAnalysisById(id);

    if (!analysis) {
      return NextResponse.json({ error: "Analysis not found." }, { status: 404 });
    }

    const [owner = "unknown", repo = "repository"] = analysis.repoName.split("/");
    const report = analysis.report as AnalysisReport;

    return NextResponse.json({
      id: analysis.id,
      savedToDatabase: true,
      snapshot: {
        owner,
        repo,
        branch: "",
        url: analysis.repoUrl,
        files: [],
        tree: [],
        techStack: analysis.techStack,
      },
      report,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "RepoMind could not load this analysis.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
