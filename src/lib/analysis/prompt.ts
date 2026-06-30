import type { AnalysisReport, RepoSnapshot } from "@/lib/analysis/types";

export function buildAnalysisPrompt(snapshot: RepoSnapshot) {
  const fileBlocks = snapshot.files
    .map(
      (file) => `
FILE: ${file.path}
LANGUAGE: ${file.language}
\`\`\`
${file.content}
\`\`\`
`,
    )
    .join("\n");

  return `
You are RepoMind, a senior software engineering reviewer.

Analyze this GitHub repository for a concise recruiter-facing code intelligence report.
Be specific, practical, and avoid inventing files that are not present. Keep each item short.

Repository: ${snapshot.url}
Detected stack: ${snapshot.techStack.join(", ") || "Unknown"}

Visible tree sample:
${snapshot.tree.slice(0, 80).join("\n")}

Important file samples:
${fileBlocks}

Return only valid JSON with this shape:
{
  "summary": "short paragraph under 70 words",
  "architecture": ["3-4 architecture observations"],
  "techStack": ["stack items"],
  "findings": [
    {
      "title": "finding title",
      "severity": "low|medium|high",
      "file": "optional file path",
      "explanation": "why it matters",
      "recommendation": "what to do"
    }
  ],
  "improvements": ["3-4 practical improvements"],
  "testIdeas": [
    {
      "title": "test title",
      "target": "file or area",
      "reason": "why this test matters"
    }
  ]
}
`;
}

export function reportToMarkdown(snapshot: RepoSnapshot, report: Omit<AnalysisReport, "markdown">) {
  const findingLines = report.findings
    .map(
      (finding) =>
        `- **${finding.severity.toUpperCase()}** ${finding.title}${finding.file ? ` (${finding.file})` : ""}: ${finding.explanation} Recommendation: ${finding.recommendation}`,
    )
    .join("\n");

  const testLines = report.testIdeas
    .map((test) => `- **${test.title}** (${test.target}): ${test.reason}`)
    .join("\n");

  return `# RepoMind Report: ${snapshot.owner}/${snapshot.repo}

## Summary
${report.summary}

## Tech Stack
${report.techStack.map((item) => `- ${item}`).join("\n") || "- Not detected"}

## Architecture
${report.architecture.map((item) => `- ${item}`).join("\n")}

## Risk Radar
${findingLines || "- No major risks found in the sampled files."}

## Improvement Brief
${report.improvements.map((item) => `- ${item}`).join("\n")}

## Test Plan
${testLines || "- Add smoke tests around the main user flow."}
`;
}
