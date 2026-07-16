"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  FolderGit2,
  GitBranch,
  LoaderCircle,
  Menu,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

type Recommendation = {
  category: string;
  recommendedTechnology: string;
  confidence: number;
  reasoning: string[];
  repositoryEvidence: string[];
  alternatives: string[];
  tradeoffs: string[];
};

type Analysis = {
  analysisId?: string;
  persistence?: { saved: boolean; message?: string };
  repository: { url: string; owner: string; name: string; defaultBranch: string };
  truncated: boolean;
  knowledgeModel: {
    scan: { totalFiles: number; totalDirectories: number };
    detectedLanguages: string[];
    detectedFrameworks: string[];
    testSignals: { hasTests: boolean };
    structureSignals: { isMonorepo: boolean };
  };
  recommendations: Recommendation[];
};

const selectClassName = "technical-input mt-2 h-12 px-3 appearance-none";

export function AnalysisWorkspace() {
  const [repoUrl, setRepoUrl] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const raw = Object.fromEntries([...form.entries()].filter(([, value]) => value !== ""));

    try {
      const response = await fetch("/api/analyses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoUrl,
          constraints: { ...raw, ...(raw.teamSize ? { teamSize: Number(raw.teamSize) } : {}) },
        }),
      });
      const body = await response.json() as Analysis & { error?: string | { message?: string } };
      const errorMessage = typeof body.error === "string" ? body.error : body.error?.message;
      if (!response.ok) throw new Error(errorMessage ?? "Review could not be completed.");
      setAnalysis(body);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Review could not be completed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="technical-grid min-h-screen text-foreground">
      <TopNav />
      <div className="grid min-h-[calc(100vh-73px)] lg:grid-cols-[400px_minmax(0,1fr)]">
        <aside className="border-b border-border-muted bg-[#1c1b1c] lg:min-h-[calc(100vh-73px)] lg:border-r lg:border-b-0">
          <div className="p-6 sm:p-8 lg:sticky lg:top-[73px]">
            <div className="flex items-center gap-2 text-accent"><Menu size={16} /><span className="technical-label">Project config</span></div>
            <h1 className="mt-3 font-mono text-xl font-medium tracking-tight text-[#f2ede6]">VULCAN-OS-01</h1>
            <form className="mt-10 space-y-6" onSubmit={submit}>
              <label className="block"><span className="technical-label text-[#d0c5b4]">GitHub URL</span><input required type="url" value={repoUrl} onChange={(event) => setRepoUrl(event.target.value)} placeholder="https://github.com/org/repo" className={`${selectClassName} placeholder:text-[#736c63]`} /></label>
              <Select label="Team size" name="teamSize" options={["1", "3", "5", "10", "25"]} defaultValue="3" />
              <Select label="Budget" name="budget" options={["low", "medium", "high"]} defaultValue="low" />
              <Select label="Expected traffic" name="expectedTraffic" options={["low", "medium", "high"]} defaultValue="medium" />
              <Select label="Data model" name="relationalPreference" options={["either", "relational", "nosql"]} defaultValue="either" />
              <Select label="Deployment" name="deploymentPreference" options={["serverless", "managed", "traditional", "self-hosted"]} defaultValue="serverless" />
              <button disabled={loading} className="technical-button flex h-12 w-full items-center justify-center gap-2 px-4">{loading ? <><LoaderCircle className="animate-spin" size={16} /> Inspecting</> : <><Sparkles size={16} /> Initiate analysis</>}</button>
            </form>
            <p className="mt-5 border-t border-[#4d4639] pt-4 text-center font-mono text-[10px] leading-5 text-[#887f73]">Privacy note: Repository code is never executed. Vulcan only analyzes static architectural signals.</p>
            <div className="mt-12 space-y-3 border-t border-[#4d4639] pt-5 text-[#bcb4a7]"><p className="flex items-center gap-3 text-sm"><CircleHelp size={16} /> Support</p><p className="flex items-center gap-3 text-sm"><CheckCircle2 className="text-accent" size={16} /> API status</p></div>
          </div>
        </aside>
        <section className="min-w-0 px-6 py-10 sm:px-10 lg:px-16 lg:py-16" aria-live="polite">
          {error ? <ErrorState message={error} /> : analysis ? <Results analysis={analysis} /> : <EmptyState />}
        </section>
      </div>
    </main>
  );
}

function TopNav() {
  return <header className="sticky top-0 z-20 flex h-[73px] items-center justify-between border-b border-[#4d4639] bg-[#131314] px-6 sm:px-8"><Link href="/" className="font-serif text-3xl font-semibold tracking-tight text-[#f5cf83]">Vulcan</Link><nav className="hidden items-center gap-8 font-mono text-sm text-[#d0c5b4] sm:flex"><Link href="/analyze" className="border-b border-accent pb-1 text-[#f5cf83]">ANALYZE REPOSITORY</Link><span className="opacity-50">HISTORY</span><span className="opacity-50">DOCUMENTATION</span></nav><div className="flex items-center gap-4 text-[#d0c5b4]"><ShieldCheck size={18} /><span className="hidden font-mono text-xs sm:inline">SYSTEM READY</span></div></header>;
}

function Select({ label, name, options, defaultValue }: { label: string; name: string; options: string[]; defaultValue: string }) {
  return <label className="relative block"><span className="technical-label text-[#d0c5b4]">{label}</span><select name={name} defaultValue={defaultValue} className={selectClassName}>{options.map((option) => <option key={option} value={option}>{option.toUpperCase()}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-9 text-[#bfb6a8]" size={17} /></label>;
}

function EmptyState() {
  const stages = [["01", "Graph Extraction", "Vulcan parses your file structure and dependency tree to build a semantic map of the application."], ["02", "Signal Processing", "We evaluate technical signals against your team, budget, and traffic constraints."], ["03", "Integrity Audit", "Static inspection keeps the review private and validates structural architecture signals."], ["04", "Decision Output", "Receive evidence-backed infrastructure decisions with clear trade-offs."]];
  return <div className="mx-auto max-w-5xl"><p className="technical-label text-accent">Engineering decision system</p><h2 className="mt-5 max-w-3xl text-4xl font-semibold tracking-[-0.045em] text-[#f2eeea] sm:text-6xl">Engineering Review Engine</h2><p className="mt-5 max-w-2xl text-lg leading-8 text-[#cbc1b4]">A deterministic analysis pipeline that transforms repository signals into validated engineering decisions. No hallucinations, only technical logic.</p><div className="mt-14 grid gap-5 md:grid-cols-2">{stages.map(([number, title, body]) => <article key={number} className="panel min-h-56 p-7 transition-colors hover:bg-[#181716]"><span className="technical-label text-accent">{number}</span><h3 className="mt-8 text-2xl font-medium tracking-tight text-[#ede7df]">{title}</h3><p className="mt-4 max-w-md leading-7 text-[#bcb2a5]">{body}</p></article>)}</div></div>;
}

function ErrorState({ message }: { message: string }) {
  return <div className="mx-auto max-w-3xl panel-raised border-[#7c3935] p-8"><AlertCircle className="text-[#ffb4ab]" size={28} /><p className="technical-label mt-7 text-[#ffb4ab]">Analysis failed</p><h2 className="mt-3 text-3xl font-semibold">Review unavailable</h2><p className="mt-4 max-w-xl leading-7 text-[#d0c5b4]">{message}</p><p className="mt-7 border-t border-[#4d4639] pt-4 font-mono text-xs text-[#a79b8c]">Verify the repository is public and deployment variables are configured.</p></div>;
}

function Results({ analysis }: { analysis: Analysis }) {
  const signals = [...analysis.knowledgeModel.detectedLanguages, ...analysis.knowledgeModel.detectedFrameworks];
  return <div className="mx-auto max-w-6xl"><div className="border-b border-[#4d4639] pb-8"><p className="technical-label flex items-center gap-2 text-accent"><CheckCircle2 size={15} /> Analysis result</p><div className="mt-6 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><h2 className="text-3xl font-semibold tracking-[-0.04em] text-[#f2eeea]">{analysis.repository.owner}/{analysis.repository.name}</h2><p className="mt-3 flex flex-wrap gap-x-4 gap-y-2 font-mono text-sm text-[#c3b9aa]"><span>branch: {analysis.repository.defaultBranch}</span>{analysis.analysisId ? <span>analysis: {analysis.analysisId.slice(-8)}</span> : <span>review: unsaved</span>}</p></div><a href={analysis.repository.url} target="_blank" rel="noreferrer" className="flex h-11 items-center gap-2 border border-[#4d4639] px-4 font-mono text-xs text-[#f5cf83] hover:bg-[#201f20]">GITHUB REPOSITORY <ArrowUpRight size={15} /></a></div></div>{!analysis.persistence?.saved && <p className="mt-5 border border-[#8e722f] bg-[#2b261b] px-4 py-3 font-mono text-xs text-[#f5cf83]">{analysis.persistence?.message ?? "Analysis completed without a saved history record."}</p>}<div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Stat icon={<FolderGit2 size={17} />} value={analysis.knowledgeModel.scan.totalFiles.toLocaleString()} label="FILES SCANNED" /><Stat icon={<GitBranch size={17} />} value={analysis.knowledgeModel.structureSignals.isMonorepo ? "MONOREPO" : "SINGLE REPO"} label={`${analysis.knowledgeModel.scan.totalDirectories} DIRECTORIES`} /><Stat icon={<ShieldCheck size={17} />} value={analysis.knowledgeModel.testSignals.hasTests ? "TESTS FOUND" : "NO TESTS"} label="RELIABILITY SIGNAL" /><div className="panel p-5"><p className="technical-label text-[#bcb2a5]">Active signals</p><div className="mt-4 flex flex-wrap gap-2">{signals.map((signal) => <span className="evidence-chip px-2 py-1" key={signal}>{signal}</span>)}</div></div></div>{analysis.truncated && <p className="mt-4 font-mono text-xs text-[#f5cf83]">Large repository: capped at 2,000 files for predictable serverless execution.</p>}<div className="mt-14 flex items-center gap-4"><p className="technical-label text-accent">Architectural recommendations</p><span className="h-px flex-1 bg-[#4d4639]" /></div><div className="mt-6 space-y-5">{analysis.recommendations.map((item) => <RecommendationCard item={item} key={item.category} />)}</div></div>;
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return <div className="panel p-5"><span className="text-accent">{icon}</span><p className="mt-8 text-2xl font-semibold tracking-tight text-[#f0eae2]">{value}</p><p className="technical-label mt-2 text-[#aaa093]">{label}</p></div>;
}

function RecommendationCard({ item }: { item: Recommendation }) {
  return <article className="panel-raised p-6 sm:p-8"><div className="flex flex-col justify-between gap-4 sm:flex-row"><div><p className="inline-flex border border-[#8e722f] bg-[#4d3e17] px-2.5 py-1 font-mono text-xs text-[#f5cf83]">{item.category.toUpperCase()}</p><h3 className="mt-5 text-2xl font-medium tracking-tight text-[#f1ece4]">{item.recommendedTechnology}</h3></div><p className="technical-label text-[#f5cf83]">{item.confidence}% confidence</p></div><p className="mt-5 max-w-3xl text-base leading-7 text-[#cbc1b4]">{item.reasoning[0]}</p><div className="mt-7 grid gap-6 border-t border-[#4d4639] pt-5 lg:grid-cols-[1fr_220px]"><div><p className="technical-label text-[#aaa093]">Evidence</p><div className="mt-3 flex flex-wrap gap-2">{item.repositoryEvidence.slice(0, 5).map((evidence) => <span className="evidence-chip px-2 py-1" key={evidence}>{evidence}</span>)}</div></div><div><p className="technical-label text-[#aaa093]">Alternatives</p><p className="mt-3 font-mono text-xs leading-5 text-[#d0c5b4]">{item.alternatives.join(" · ")}</p></div></div>{item.tradeoffs.length > 0 && <details className="mt-6 border-t border-[#4d4639] pt-4"><summary className="cursor-pointer font-mono text-xs text-[#d0c5b4]">VIEW TRADE-OFFS</summary><ul className="mt-3 space-y-2 text-sm leading-6 text-[#aaa093]">{item.tradeoffs.map((tradeoff) => <li key={tradeoff}>— {tradeoff}</li>)}</ul></details>}</article>;
}
