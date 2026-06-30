"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Brain,
  CheckCircle2,
  Clipboard,
  Download,
  FileCode2,
  GitBranch,
  History,
  Loader2,
  Radar,
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

  return (
    <main className="min-h-screen bg-[#101113] text-zinc-100">
      <section className="border-b border-white/10 bg-[#15171a]">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-8 sm:px-8 lg:px-10">
          <nav className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-400 text-zinc-950">
                <Brain size={22} />
              </div>
              <div>
                <p className="text-lg font-semibold">GitGuru</p>
                <p className="text-sm text-zinc-400">LangGraph code intelligence</p>
              </div>
            </div>
            <div className="hidden items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-sm text-zinc-300 sm:flex">
              <Sparkles size={15} className="text-cyan-300" />
              Groq locked in
            </div>
          </nav>

          <div className="grid gap-7 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1 text-sm text-amber-100">
                <GitBranch size={15} />
                GitHub repository analyzer
              </div>
              <div className="space-y-3">
                <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-white sm:text-5xl">
                  Turn any repository into an architecture report, risk radar, and test plan.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-zinc-300">
                  GitGuru scans high-signal files, runs a LangGraph review workflow, asks Groq for
                  engineering analysis, and stores the result in Neon when configured.
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-[#1d2024] p-4 shadow-2xl shadow-black/20">
              <label htmlFor="repo-url" className="text-sm font-medium text-zinc-200">
                GitHub repo URL
              </label>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                <input
                  id="repo-url"
                  value={repoUrl}
                  onChange={(event) => setRepoUrl(event.target.value)}
                  className="h-12 min-w-0 flex-1 rounded-md border border-white/10 bg-[#111316] px-4 text-sm text-zinc-100 outline-none transition focus:border-emerald-300"
                  placeholder="https://github.com/owner/repo"
                />
                <button
                  onClick={analyzeRepo}
                  disabled={isLoading || repoUrl.trim().length === 0}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-emerald-400 px-5 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading ? <Loader2 size={17} className="animate-spin" /> : <Radar size={17} />}
                  Analyze
                </button>
              </div>
              <p className="mt-3 text-xs leading-5 text-zinc-500">
                Add GROQ_API_KEY for AI analysis. Add DATABASE_URL to save reports in Neon.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-5 px-5 py-6 sm:px-8 lg:grid-cols-3 lg:px-10">
        <Metric icon={<FileCode2 size={18} />} label="Scan strategy" value="6 focused files" />
        <Metric icon={<Brain size={18} />} label="Workflow" value="LangGraph nodes" />
        <Metric icon={<CheckCircle2 size={18} />} label="Output" value="Markdown report" />
      </section>

      <section className="mx-auto grid max-w-6xl gap-5 px-5 pb-12 sm:px-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-10">
        <div className="min-w-0">
        {error ? (
          <div className="rounded-lg border border-red-300/20 bg-red-300/10 p-4 text-sm text-red-100">
            <div className="flex items-center gap-2 font-semibold">
              <AlertTriangle size={17} />
              Analysis failed
            </div>
            <p className="mt-2 text-red-100/80">{error}</p>
          </div>
        ) : null}

        {isLoading ? (
          <div className="rounded-lg border border-white/10 bg-[#171a1e] p-8">
            <div className="flex items-center gap-3 text-zinc-200">
              <Loader2 className="animate-spin text-emerald-300" />
              Scanning repository, building prompt, and running the LangGraph review.
            </div>
          </div>
        ) : null}

        {result ? <ReportView result={result} /> : null}

        {!result && !isLoading ? (
          <div className="grid gap-5 lg:grid-cols-3">
            <Feature
              title="Architecture Map"
              text="Explains repository structure, entry points, and module responsibilities."
            />
            <Feature
              title="Risk Radar"
              text="Highlights likely bugs, maintainability issues, and missing guardrails."
            />
            <Feature
              title="Test Plan"
              text="Suggests practical tests for the most important paths in the codebase."
            />
          </div>
        ) : null}
        </div>

        <RecentAnalyses
          analyses={recentAnalyses}
          isDatabaseConfigured={isDatabaseConfigured}
          onSelectRepo={setRepoUrl}
          onOpenAnalysis={openSavedAnalysis}
        />
      </section>
    </main>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-[#171a1e] p-4">
      <div className="flex items-center gap-3 text-emerald-300">{icon}</div>
      <p className="mt-4 text-sm text-zinc-500">{label}</p>
      <p className="mt-1 font-medium text-zinc-100">{value}</p>
    </div>
  );
}

function Feature({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-[#171a1e] p-5">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-zinc-400">{text}</p>
    </div>
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

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-white/10 bg-[#171a1e] p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-zinc-500">Analysis report</p>
            <h2 className="text-2xl font-semibold text-white">
              {result.snapshot.owner}/{result.snapshot.repo}
            </h2>
          </div>
          <div className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-400">
            {result.savedToDatabase ? "Saved to Neon" : "Not saved"}
          </div>
        </div>
        <p className="mt-4 leading-7 text-zinc-300">{result.report.summary}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {result.report.techStack.length > 0 ? (
            result.report.techStack.map((item) => (
              <span
                key={item}
                className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2.5 py-1 text-xs font-medium text-emerald-100"
              >
                {item}
              </span>
            ))
          ) : (
            <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-zinc-500">
              Stack not detected
            </span>
          )}
        </div>
        <button
          onClick={downloadMarkdown}
          className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-md border border-white/10 bg-white/5 px-4 text-sm font-medium text-zinc-100 transition hover:bg-white/10"
        >
          <Download size={16} />
          Download Markdown
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Architecture Map" items={result.report.architecture} />
        <Panel title="Improvement Brief" items={result.report.improvements} />
      </div>

      <div className="rounded-lg border border-white/10 bg-[#171a1e] p-5">
        <h3 className="text-lg font-semibold text-white">Risk Radar</h3>
        <div className="mt-4 space-y-3">
          {result.report.findings.length > 0 ? result.report.findings.map((finding) => (
            <div key={`${finding.title}-${finding.file}`} className="rounded-md border border-white/10 bg-[#111316] p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2 py-1 text-xs font-medium ${severityClassName(finding.severity)}`}>
                  {finding.severity}
                </span>
                <h4 className="font-medium text-zinc-100">{finding.title}</h4>
              </div>
              {finding.file ? <p className="mt-2 font-mono text-xs text-cyan-200">{finding.file}</p> : null}
              <p className="mt-3 text-sm leading-6 text-zinc-400">{finding.explanation}</p>
              <p className="mt-2 text-sm leading-6 text-zinc-300">{finding.recommendation}</p>
            </div>
          )) : (
            <p className="rounded-md border border-white/10 bg-[#111316] p-4 text-sm text-zinc-500">
              No risks returned for this focused scan.
            </p>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-white/10 bg-[#171a1e] p-5">
        <h3 className="text-lg font-semibold text-white">Test Plan</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {result.report.testIdeas.length > 0 ? result.report.testIdeas.map((test) => (
            <div key={`${test.title}-${test.target}`} className="rounded-md border border-white/10 bg-[#111316] p-4">
              <h4 className="font-medium text-zinc-100">{test.title}</h4>
              <p className="mt-2 font-mono text-xs text-emerald-200">{test.target}</p>
              <p className="mt-3 text-sm leading-6 text-zinc-400">{test.reason}</p>
            </div>
          )) : (
            <p className="rounded-md border border-white/10 bg-[#111316] p-4 text-sm text-zinc-500 md:col-span-2">
              No test ideas returned for this focused scan.
            </p>
          )}
        </div>
      </div>

      <PatchSuggestions result={result} />
    </div>
  );
}

function PatchSuggestions({ result }: { result: AnalysisResult }) {
  const patchSuggestions = result.report.patchSuggestions ?? [];

  async function copyPatch(patch: string) {
    await navigator.clipboard.writeText(patch);
  }

  return (
    <div className="rounded-lg border border-white/10 bg-[#171a1e] p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">PR-style patch suggestions</h3>
          <p className="mt-1 text-sm leading-6 text-zinc-500">
            Review-ready changes generated from the focused file scan.
          </p>
        </div>
        <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-zinc-400">
          {patchSuggestions.length} suggestions
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {patchSuggestions.length > 0 ? (
          patchSuggestions.map((patch) => (
            <article
              key={`${patch.file}-${patch.title}`}
              className="rounded-md border border-white/10 bg-[#111316]"
            >
              <div className="border-b border-white/10 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${severityClassName(patch.severity)}`}>
                    {patch.severity}
                  </span>
                  <h4 className="font-medium text-zinc-100">{patch.title}</h4>
                </div>
                <p className="mt-2 font-mono text-xs text-cyan-200">{patch.file}</p>
                <p className="mt-3 text-sm leading-6 text-zinc-400">{patch.rationale}</p>
              </div>
              <div className="p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-xs font-medium uppercase text-zinc-500">Suggested diff</p>
                  <button
                    onClick={() => void copyPatch(patch.suggestedDiff)}
                    className="inline-flex h-8 items-center gap-2 rounded-md border border-white/10 px-3 text-xs font-medium text-zinc-300 transition hover:bg-white/5"
                  >
                    <Clipboard size={14} />
                    Copy
                  </button>
                </div>
                <pre className="max-h-72 overflow-auto rounded-md border border-white/10 bg-black/30 p-4 text-xs leading-5 text-zinc-200">
                  <code>{patch.suggestedDiff}</code>
                </pre>
              </div>
            </article>
          ))
        ) : (
          <p className="rounded-md border border-white/10 bg-[#111316] p-4 text-sm text-zinc-500">
            No patch suggestions returned for this focused scan.
          </p>
        )}
      </div>
    </div>
  );
}

function RecentAnalyses({
  analyses,
  isDatabaseConfigured,
  onSelectRepo,
  onOpenAnalysis,
}: {
  analyses: RecentAnalysis[];
  isDatabaseConfigured: boolean;
  onSelectRepo: (repoUrl: string) => void;
  onOpenAnalysis: (id: string) => void;
}) {
  return (
    <aside className="h-fit rounded-lg border border-white/10 bg-[#171a1e] p-5">
      <div className="flex items-center gap-2 text-zinc-100">
        <History size={18} className="text-emerald-300" />
        <h2 className="font-semibold">Recent analyses</h2>
      </div>

      {!isDatabaseConfigured ? (
        <p className="mt-4 text-sm leading-6 text-zinc-500">
          Connect Neon with DATABASE_URL to store and show analysis history.
        </p>
      ) : null}

      {isDatabaseConfigured && analyses.length === 0 ? (
        <p className="mt-4 text-sm leading-6 text-zinc-500">
          No saved reports yet. Run an analysis to create the first history item.
        </p>
      ) : null}

      {analyses.length > 0 ? (
        <div className="mt-4 space-y-3">
          {analyses.map((analysis) => (
            <div
              key={analysis.id}
              className="rounded-md border border-white/10 bg-[#111316] p-3"
            >
              <p className="truncate text-sm font-medium text-zinc-100">{analysis.repoName}</p>
              <p className="mt-1 text-xs text-zinc-500">
                {new Date(analysis.createdAt).toLocaleString()}
              </p>
              {analysis.techStack.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {analysis.techStack.slice(0, 3).map((item) => (
                    <span
                      key={item}
                      className="rounded-full bg-emerald-300/10 px-2 py-0.5 text-xs text-emerald-100"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              ) : null}
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => onOpenAnalysis(analysis.id)}
                  className="h-8 rounded-md bg-emerald-300 px-3 text-xs font-semibold text-zinc-950 transition hover:bg-emerald-200"
                >
                  Open
                </button>
                <button
                  onClick={() => onSelectRepo(analysis.repoUrl)}
                  className="h-8 rounded-md border border-white/10 px-3 text-xs font-medium text-zinc-300 transition hover:bg-white/5"
                >
                  Reuse URL
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </aside>
  );
}

function Panel({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-white/10 bg-[#171a1e] p-5">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <ul className="mt-4 space-y-3">
        {items.length > 0 ? items.map((item) => (
          <li key={item} className="text-sm leading-6 text-zinc-400">
            {item}
          </li>
        )) : (
          <li className="text-sm leading-6 text-zinc-500">No items returned for this section.</li>
        )}
      </ul>
    </div>
  );
}

function severityClassName(severity: "low" | "medium" | "high") {
  if (severity === "high") {
    return "bg-red-300/15 text-red-100";
  }

  if (severity === "medium") {
    return "bg-amber-300/15 text-amber-100";
  }

  return "bg-cyan-300/15 text-cyan-100";
}
