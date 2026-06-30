export type RepoFile = {
  path: string;
  language: string;
  content: string;
};

export type RepoSnapshot = {
  owner: string;
  repo: string;
  branch: string;
  url: string;
  files: RepoFile[];
  tree: string[];
  techStack: string[];
};

export type Finding = {
  title: string;
  severity: "low" | "medium" | "high";
  file?: string;
  explanation: string;
  recommendation: string;
};

export type TestIdea = {
  title: string;
  target: string;
  reason: string;
};

export type AnalysisReport = {
  summary: string;
  architecture: string[];
  techStack: string[];
  findings: Finding[];
  improvements: string[];
  testIdeas: TestIdea[];
  markdown: string;
};

export type AnalysisInput = {
  repoUrl: string;
};

export type AnalysisResult = {
  id: string;
  snapshot: RepoSnapshot;
  report: AnalysisReport;
  savedToDatabase: boolean;
};
