"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Brain,
  CheckCircle2,
  Clipboard,
  Download,
  FileCode2,
  GitBranch,
  History,
  Loader2,
  Radar,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import type { AnalysisResult } from "@/lib/analysis/types";

type RecentAnalysis = {
  id: string;
  repoUrl: string;
  repoName: string;
  status: string;
  techStack: string[];
  createdAt: string;
};

const loadingStages = [
  "Parsing repository shape",
  "Selecting high-signal files",
  "Asking Groq for review notes",
  "Assembling patch suggestions",
];

export function RepoAnalyzer() {
  const [repoUrl, setRepoUrl] = useState("https://github.com/vercel/ai");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [recentAnalyses, setRecentAnalyses] = useState<RecentAnalysis[]>([]);
  const [isDatabaseConfigured, setIsDatabaseConfigured] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    void fetchRecentAnalyses();
  }, []);

  async function fetchRecentAnalyses() {
    try {
      const response = await fetch("/api/analyses");
      const payload = await response.json();

      if (response.ok) {
        setRecentAnalyses(payload.analyses ?? []);
        setIsDatabaseConfigured(Boolean(payload.configured));
      }
    } catch {
      setRecentAnalyses([]);
      setIsDatabaseConfigured(false);
    }
  }

  async function analyzeRepo() {
    setIsLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Analysis failed.");
      }

      setResult(payload);
      void fetchRecentAnalyses();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Analysis failed.");
    } finally {
      setIsLoading(false);
    }
  }

  async function openSavedAnalysis(id: string) {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/analyses/${id}`);
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not load saved analysis.");
      }

      setRepoUrl(payload.snapshot.url);
      setResult(payload);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not load saved analysis.");
    } finally {
      setIsLoading(false);
    }
  }

  const repoLabel = repoUrl.replace(/^https?:\/\/(www\.)?github\.com\//, "").replace(/\/$/, "");

  return (
    <main className="min-h-screen text-foreground paper-grid">
      <div className="mx-auto max-w-7xl px-4 py-4 lg:px-8">
        <header className="surface-strong ink-shadow sticky top-4 z-20 rounded-[18px] px-4 py-3 backdrop-blur-md">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-[14px] bg-[#1f7a66] text-[#f8f4ec]">
                <Brain size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-2xl leading-none tracking-tight">GitGuru</h1>
                  <span className="rounded-full border border-[rgba(60,45,34,0.16)] bg-[rgba(255,252,248,0.8)] px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#5d4a3f]">
                    repo review desk
                  </span>
                </div>
                <p className="mt-1 text-sm text-[#6e5d51]">LangGraph code intelligence for GitHub repositories</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm">
              <StatusPill icon={<Sparkles size={14} />} text="Groq ready" />
              <StatusPill icon={<History size={14} />} text="Neon archive" />
              <StatusPill icon={<CheckCircle2 size={14} />} text="Patch suggestions" />
            </div>
          </div>
        </header>

        <section className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_420px]">
          <div className="surface-strong ink-shadow rounded-[22px] p-5 lg:p-6">
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_220px] xl:items-end">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(60,45,34,0.14)] bg-white/60 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#5f5248]">
                    <GitBranch size={13} />
                    GitHub repository analyzer
                  </div>
                </div>
                <div className="space-y-3">
                  <h2 className="font-display max-w-3xl text-5xl leading-[0.95] tracking-tight text-[#201814] sm:text-6xl">
                    Turn a repository into a review dossier, not a generic AI blob.
                  </h2>
                  <p className="max-w-2xl text-base leading-7 text-[#4f4137]">
                    GitGuru scans the strongest parts of a repo, explains the architecture, flags
                    risks, and writes PR-style patch suggestions you can actually use.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#5e5147]">
                  <MetaChip label="Scan target" value={repoLabel || "GitHub repo"} />
                  <MetaChip label="Focused files" value="6" />
                  <MetaChip label="Report style" value="Editorial review" />
                </div>
              </div>

              <div className="surface rounded-[18px] p-4">
                <label htmlFor="repo-url" className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6f5f53]">
                  Repository URL
                </label>
                <div className="mt-3 space-y-3">
                  <input
                    id="repo-url"
                    value={repoUrl}
                    onChange={(event) => setRepoUrl(event.target.value)}
                    className="h-12 w-full rounded-[14px] border border-[rgba(60,45,34,0.16)] bg-[#fffdf9] px-4 text-sm text-[#201814] outline-none transition focus:border-[#1f7a66] focus:ring-2 focus:ring-[#1f7a66]/10"
                    placeholder="https://github.com/owner/repo"
                  />
                  <button
                    onClick={analyzeRepo}
                    disabled={isLoading || repoUrl.trim().length === 0}
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[14px] bg-[#1f7a66] px-5 text-sm font-semibold text-[#f8f4ec] transition hover:bg-[#166555] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isLoading ? <Loader2 size={17} className="animate-spin" /> : <Radar size={17} />}
                    Analyze repo
                    <ArrowRight size={16} />
                  </button>
                  <p className="text-xs leading-5 text-[#6f5f53]">
                    Add `GROQ_API_KEY` for real analysis. Add `DATABASE_URL` for recent-history
                    panels.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <Metric icon={<FileCode2 size={18} />} label="Scan strategy" value="6 focused files" />
              <Metric icon={<Brain size={18} />} label="Workflow" value="LangGraph nodes" />
              <Metric icon={<CheckCircle2 size={18} />} label="Output" value="Markdown + patches" />
            </div>

            <div className="mt-6">
              {error ? (
                <div className="flex items-start gap-3 rounded-[16px] border border-[#c75b5b]/25 bg-[#fff4f4] px-4 py-3 text-sm text-[#7a2f2f]">
                  <AlertTriangle size={17} className="mt-0.5 shrink-0" />
                  <div>
                    <div className="font-semibold">Analysis failed</div>
                    <p className="mt-1">{error}</p>
                  </div>
                </div>
              ) : null}

              {isLoading ? (
                <div className="surface rounded-[16px] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 text-[#352820]">
                      <Loader2 className="animate-spin text-[#1f7a66]" />
                      <span className="font-medium">Working through the review pipeline</span>
                    </div>
                    <div className="hidden gap-2 md:flex">
                      {loadingStages.map((stage) => (
                        <span
                          key={stage}
                          className="rounded-full border border-[rgba(60,45,34,0.14)] bg-white/70 px-3 py-1 text-xs text-[#6f5f53]"
                        >
                          {stage}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-[rgba(60,45,34,0.08)]">
                    <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-[#1f7a66] via-[#5f7f74] to-[#aa5d2e]" />
                  </div>
                </div>
              ) : null}

              {!result && !isLoading ? (
                <div className="grid gap-3 lg:grid-cols-3">
                  <SoftFeature
                    title="Architecture map"
                    text="Shows how the repo is organized and which files matter most."
                  />
                  <SoftFeature
                    title="Risk radar"
                    text="Highlights likely bugs, missing guardrails, and weak points."
                  />
                  <SoftFeature
                    title="Patch review"
                    text="Returns concise, PR-style fix suggestions with diff snippets."
                  />
                </div>
              ) : null}

              {result ? <ReportView result={result} /> : null}
            </div>
          </div>

          <aside className="space-y-5">
            <div className="surface-strong ink-shadow rounded-[22px] p-5">
              <div className="flex items-center gap-2">
                <History size={18} className="text-[#1f7a66]" />
                <h3 className="font-display text-2xl leading-none text-[#201814]">Archive rail</h3>
              </div>
              <p className="mt-2 text-sm leading-6 text-[#5d4a3f]">
                Reopen past reviews or reuse a repo URL in one click.
              </p>
              <div className="mt-4 space-y-3">
                {!isDatabaseConfigured ? (
                  <div className="rounded-[16px] border border-[rgba(60,45,34,0.14)] bg-white/70 p-4 text-sm text-[#6f5f53]">
                    Connect Neon with `DATABASE_URL` to store recent reviews here.
                  </div>
                ) : null}

                {isDatabaseConfigured && recentAnalyses.length === 0 ? (
                  <div className="rounded-[16px] border border-[rgba(60,45,34,0.14)] bg-white/70 p-4 text-sm text-[#6f5f53]">
                    No archived reviews yet. Run the first analysis and GitGuru will keep it here.
                  </div>
                ) : null}

                {recentAnalyses.map((analysis) => (
                  <article key={analysis.id} className="rounded-[16px] border border-[rgba(60,45,34,0.14)] bg-white/75 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-[#201814]">{analysis.repoName}</p>
                        <p className="mt-1 text-xs text-[#6f5f53]">{new Date(analysis.createdAt).toLocaleString()}</p>
                      </div>
                      <span className="rounded-full border border-[rgba(60,45,34,0.14)] bg-[#f7f2ea] px-2 py-1 text-[11px] text-[#6f5f53]">
                        {analysis.status}
                      </span>
                    </div>
                    {analysis.techStack.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {analysis.techStack.slice(0, 3).map((item) => (
                          <span
                            key={item}
                            className="rounded-full bg-[#1f7a66]/10 px-2 py-1 text-xs text-[#1f7a66]"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => openSavedAnalysis(analysis.id)}
                        className="h-8 rounded-[12px] bg-[#1f7a66] px-3 text-xs font-semibold text-[#f8f4ec] transition hover:bg-[#166555]"
                      >
                        Open review
                      </button>
                      <button
                        onClick={() => setRepoUrl(analysis.repoUrl)}
                        className="h-8 rounded-[12px] border border-[rgba(60,45,34,0.16)] px-3 text-xs font-medium text-[#4f4137] transition hover:bg-white/70"
                      >
                        Reuse URL
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="surface rounded-[22px] p-5">
              <div className="flex items-center gap-2">
                <ShieldAlert size={18} className="text-[#aa5d2e]" />
                <h3 className="font-display text-2xl leading-none text-[#201814]">Working notes</h3>
              </div>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-[#5d4a3f]">
                <li className="flex gap-2">
                  <span className="mt-2 size-1.5 rounded-full bg-[#1f7a66]" />
                  Patch suggestions are review comments, not auto-applied changes.
                </li>
                <li className="flex gap-2">
                  <span className="mt-2 size-1.5 rounded-full bg-[#aa5d2e]" />
                  The scan stays focused to keep Groq usage within free-tier limits.
                </li>
                <li className="flex gap-2">
                  <span className="mt-2 size-1.5 rounded-full bg-[#5f7f74]" />
                  Saved reports can be reopened from the archive rail.
                </li>
              </ul>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="surface rounded-[18px] px-4 py-4">
      <div className="flex items-center gap-3 text-[#1f7a66]">{icon}</div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#6f5f53]">{label}</p>
      <p className="mt-1 text-sm font-medium text-[#201814]">{value}</p>
    </div>
  );
}

function StatusPill({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(60,45,34,0.14)] bg-white/70 px-3 py-1.5 text-sm text-[#4f4137]">
      <span className="text-[#1f7a66]">{icon}</span>
      {text}
    </span>
  );
}

function MetaChip({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(60,45,34,0.14)] bg-white/70 px-3 py-1">
      <span className="text-[11px] uppercase tracking-[0.18em] text-[#7b6a5d]">{label}</span>
      <span className="font-code text-sm text-[#201814]">{value}</span>
    </span>
  );
}

function SoftFeature({ title, text }: { title: string; text: string }) {
  return (
    <article className="surface rounded-[18px] px-4 py-4">
      <h3 className="font-display text-2xl leading-none text-[#201814]">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-[#5d4a3f]">{text}</p>
    </article>
  );
}

function ReportView({ result }: { result: AnalysisResult }) {
  function downloadMarkdown() {
    const blob = new Blob([result.report.markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `gitguru-${result.snapshot.owner}-${result.snapshot.repo}.md`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  const patchSuggestions = result.report.patchSuggestions ?? [];

  return (
    <section className="surface-strong mt-5 rounded-[22px] p-5 lg:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6f5f53]">Analysis report</p>
          <h3 className="mt-2 font-display text-4xl leading-none text-[#201814]">
            {result.snapshot.owner}/{result.snapshot.repo}
          </h3>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[#5d4a3f]">{result.report.summary}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-[rgba(60,45,34,0.14)] bg-white/70 px-3 py-1.5 text-xs text-[#6f5f53]">
            {result.savedToDatabase ? "Saved to Neon" : "Not saved"}
          </span>
          <button
            onClick={downloadMarkdown}
            className="inline-flex h-10 items-center gap-2 rounded-[14px] bg-[#201814] px-4 text-sm font-semibold text-[#f8f4ec] transition hover:bg-[#2a211d]"
          >
            <Download size={16} />
            Download report
          </button>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {result.report.techStack.length > 0 ? (
          result.report.techStack.map((item) => (
            <span key={item} className="rounded-full bg-[#1f7a66]/10 px-3 py-1 text-xs font-medium text-[#1f7a66]">
              {item}
            </span>
          ))
        ) : (
          <span className="rounded-full border border-[rgba(60,45,34,0.14)] bg-white/70 px-3 py-1 text-xs text-[#6f5f53]">
            Stack not detected
          </span>
        )}
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <SectionPanel
          title="Architecture map"
          eyebrow="What the repo looks like"
          items={result.report.architecture}
          note="A quick read on structure and responsibilities."
        />
        <SectionPanel
          title="Improvement brief"
          eyebrow="Practical next moves"
          items={result.report.improvements}
          note="Short, actionable changes to tighten the codebase."
        />
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <RiskPanel findings={result.report.findings} />
        <TestPanel tests={result.report.testIdeas} />
      </div>

      <PatchSuggestionsPanel suggestions={patchSuggestions} />
    </section>
  );
}

function SectionPanel({
  title,
  eyebrow,
  items,
  note,
}: {
  title: string;
  eyebrow: string;
  items: string[];
  note: string;
}) {
  return (
    <article className="rounded-[20px] border border-[rgba(60,45,34,0.14)] bg-white/75 p-5">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6f5f53]">{eyebrow}</p>
          <h4 className="mt-2 font-display text-3xl leading-none text-[#201814]">{title}</h4>
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-[#6f5f53]">{note}</p>
      <div className="mt-4 space-y-3 border-t border-[rgba(60,45,34,0.12)] pt-4">
        {items.length > 0 ? (
          items.map((item) => (
            <div key={item} className="flex gap-3">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#1f7a66]" />
              <p className="text-sm leading-6 text-[#2a201b]">{item}</p>
            </div>
          ))
        ) : (
          <p className="text-sm leading-6 text-[#6f5f53]">No items returned for this section.</p>
        )}
      </div>
    </article>
  );
}

function RiskPanel({ findings }: { findings: AnalysisResult["report"]["findings"] }) {
  return (
    <article className="rounded-[20px] border border-[rgba(60,45,34,0.14)] bg-white/75 p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6f5f53]">Risk radar</p>
          <h4 className="mt-2 font-display text-3xl leading-none text-[#201814]">Issues worth fixing</h4>
        </div>
        <ShieldAlert size={18} className="text-[#aa5d2e]" />
      </div>
      <div className="mt-4 space-y-3 border-t border-[rgba(60,45,34,0.12)] pt-4">
        {findings.length > 0 ? (
          findings.map((finding) => (
            <section key={`${finding.title}-${finding.file}`} className="rounded-[16px] border border-[rgba(60,45,34,0.14)] bg-[#fffdf9] p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${severityClassName(finding.severity)}`}>
                  {finding.severity}
                </span>
                <h5 className="font-medium text-[#201814]">{finding.title}</h5>
              </div>
              {finding.file ? <p className="mt-2 font-code text-xs text-[#1f7a66]">{finding.file}</p> : null}
              <p className="mt-3 text-sm leading-6 text-[#4f4137]">{finding.explanation}</p>
              <p className="mt-2 text-sm leading-6 text-[#2a201b]">{finding.recommendation}</p>
            </section>
          ))
        ) : (
          <p className="text-sm leading-6 text-[#6f5f53]">No risks returned for this focused scan.</p>
        )}
      </div>
    </article>
  );
}

function TestPanel({ tests }: { tests: AnalysisResult["report"]["testIdeas"] }) {
  return (
    <article className="rounded-[20px] border border-[rgba(60,45,34,0.14)] bg-white/75 p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6f5f53]">Test plan</p>
          <h4 className="mt-2 font-display text-3xl leading-none text-[#201814]">Confidence checks</h4>
        </div>
        <CheckCircle2 size={18} className="text-[#1f7a66]" />
      </div>
      <div className="mt-4 space-y-3 border-t border-[rgba(60,45,34,0.12)] pt-4">
        {tests.length > 0 ? (
          tests.map((test) => (
            <section key={`${test.title}-${test.target}`} className="rounded-[16px] border border-[rgba(60,45,34,0.14)] bg-[#fffdf9] p-4">
              <h5 className="font-medium text-[#201814]">{test.title}</h5>
              <p className="mt-2 font-code text-xs text-[#1f7a66]">{test.target}</p>
              <p className="mt-3 text-sm leading-6 text-[#4f4137]">{test.reason}</p>
            </section>
          ))
        ) : (
          <p className="text-sm leading-6 text-[#6f5f53]">No test ideas returned for this focused scan.</p>
        )}
      </div>
    </article>
  );
}

function PatchSuggestionsPanel({
  suggestions,
}: {
  suggestions: NonNullable<AnalysisResult["report"]["patchSuggestions"]>;
}) {
  async function copyPatch(patch: string) {
    await navigator.clipboard.writeText(patch);
  }

  return (
    <article className="mt-6 rounded-[20px] border border-[rgba(60,45,34,0.14)] bg-white/75 p-5">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6f5f53]">PR-style review</p>
          <h4 className="mt-2 font-display text-3xl leading-none text-[#201814]">Patch suggestions</h4>
          <p className="mt-3 text-sm leading-6 text-[#5d4a3f]">
            Small review comments with diff snippets that can guide a real pull request.
          </p>
        </div>
        <span className="inline-flex w-fit rounded-full border border-[rgba(60,45,34,0.14)] bg-white/70 px-3 py-1 text-xs text-[#6f5f53]">
          {suggestions.length} suggestions
        </span>
      </div>

      <div className="mt-4 space-y-4 border-t border-[rgba(60,45,34,0.12)] pt-4">
        {suggestions.length > 0 ? (
          suggestions.map((patch) => (
            <section key={`${patch.file}-${patch.title}`} className="rounded-[18px] border border-[rgba(60,45,34,0.14)] bg-[#fffdf9] p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${severityClassName(patch.severity)}`}>
                  {patch.severity}
                </span>
                <h5 className="font-medium text-[#201814]">{patch.title}</h5>
              </div>
              <p className="mt-2 font-code text-xs text-[#1f7a66]">{patch.file}</p>
              <p className="mt-3 text-sm leading-6 text-[#4f4137]">{patch.rationale}</p>
              <div className="mt-4 flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6f5f53]">Suggested diff</p>
                <button
                  onClick={() => void copyPatch(patch.suggestedDiff)}
                  className="inline-flex h-8 items-center gap-2 rounded-[12px] border border-[rgba(60,45,34,0.16)] px-3 text-xs font-medium text-[#4f4137] transition hover:bg-white/80"
                >
                  <Clipboard size={14} />
                  Copy
                </button>
              </div>
              <pre className="mt-3 max-h-72 overflow-auto rounded-[14px] border border-[rgba(60,45,34,0.14)] bg-[#201814] p-4 text-xs leading-5 text-[#f3eadf]">
                <code>{patch.suggestedDiff}</code>
              </pre>
            </section>
          ))
        ) : (
          <p className="text-sm leading-6 text-[#6f5f53]">No patch suggestions returned for this focused scan.</p>
        )}
      </div>
    </article>
  );
}

function severityClassName(severity: "low" | "medium" | "high") {
  if (severity === "high") {
    return "bg-[#aa5d2e]/10 text-[#8e3e20]";
  }

  if (severity === "medium") {
    return "bg-[#1f7a66]/10 text-[#1f7a66]";
  }

  return "bg-[#5f7f74]/10 text-[#4c635d]";
}
