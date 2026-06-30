import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import Groq from "groq-sdk";
import { z } from "zod";
import { buildAnalysisPrompt, reportToMarkdown } from "@/lib/analysis/prompt";
import type { AnalysisInput, AnalysisReport, RepoSnapshot } from "@/lib/analysis/types";
import { scanGitHubRepository } from "@/lib/github";

const findingSchema = z.object({
  title: z.string(),
  severity: z.enum(["low", "medium", "high"]),
  file: z.string().optional(),
  explanation: z.string(),
  recommendation: z.string(),
});

const reportSchema = z.object({
  summary: z.string(),
  architecture: z.array(z.string()).default([]),
  techStack: z.array(z.string()).default([]),
  findings: z.array(findingSchema).default([]),
  improvements: z.array(z.string()).default([]),
  testIdeas: z
    .array(
      z.object({
        title: z.string(),
        target: z.string(),
        reason: z.string(),
      }),
    )
    .default([]),
});

const AnalysisState = Annotation.Root({
  input: Annotation<AnalysisInput>,
  snapshot: Annotation<RepoSnapshot | undefined>,
  prompt: Annotation<string | undefined>,
  report: Annotation<AnalysisReport | undefined>,
});

export async function runAnalysisGraph(input: AnalysisInput) {
  const graph = new StateGraph(AnalysisState)
    .addNode("scanRepository", async (state) => {
      const snapshot = await scanGitHubRepository(state.input.repoUrl);
      return { snapshot };
    })
    .addNode("buildPrompt", async (state) => {
      if (!state.snapshot) throw new Error("Repository scan did not complete.");
      return { prompt: buildAnalysisPrompt(state.snapshot) };
    })
    .addNode("generateReport", async (state) => {
      if (!state.snapshot || !state.prompt) throw new Error("Analysis prompt was not prepared.");
      const report = await generateReport(state.snapshot, state.prompt);
      return { report };
    })
    .addEdge(START, "scanRepository")
    .addEdge("scanRepository", "buildPrompt")
    .addEdge("buildPrompt", "generateReport")
    .addEdge("generateReport", END)
    .compile();

  const result = await graph.invoke({ input });

  if (!result.snapshot || !result.report) {
    throw new Error("Analysis did not produce a report.");
  }

  return {
    snapshot: result.snapshot,
    report: result.report,
  };
}

async function generateReport(snapshot: RepoSnapshot, prompt: string): Promise<AnalysisReport> {
  if (!process.env.GROQ_API_KEY) {
    return buildFallbackReport(snapshot);
  }

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const completion = await groq.chat.completions.create({
    model: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You produce strict JSON for software architecture and code review reports. Do not include markdown fences.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const rawContent = completion.choices[0]?.message.content;

  if (!rawContent) {
    throw new Error("Groq returned an empty response.");
  }

  const parsed = reportSchema.parse(JSON.parse(rawContent));
  const markdown = reportToMarkdown(snapshot, parsed);

  return {
    ...parsed,
    markdown,
  };
}

function buildFallbackReport(snapshot: RepoSnapshot): AnalysisReport {
  const report = {
    summary: `${snapshot.owner}/${snapshot.repo} was scanned from GitHub. RepoMind detected ${snapshot.techStack.join(", ") || "a general codebase"} and sampled ${snapshot.files.length} important files. Add GROQ_API_KEY to generate a deeper AI review.`,
    architecture: [
      "The repository is summarized from its visible file tree and high-signal source files.",
      "Configuration and entry-point files are prioritized before deeper implementation files.",
      "The current scan is designed for quick architecture understanding rather than full static analysis.",
    ],
    techStack: snapshot.techStack,
    findings: [
      {
        title: "AI review is not configured",
        severity: "medium" as const,
        explanation: "RepoMind needs a Groq API key before it can generate detailed code findings.",
        recommendation: "Set GROQ_API_KEY in .env.local and run the analysis again.",
      },
    ],
    improvements: [
      "Configure Groq for full AI analysis.",
      "Add a GitHub token if you plan to scan many repositories.",
      "Keep scan limits focused so reports stay fast and readable.",
    ],
    testIdeas: [
      {
        title: "Analysis route smoke test",
        target: "/api/analyze",
        reason: "The main product flow depends on reliable report generation.",
      },
    ],
  };

  return {
    ...report,
    markdown: reportToMarkdown(snapshot, report),
  };
}
