import type { RepoFile, RepoSnapshot } from "@/lib/analysis/types";

const MAX_FILES = 6;
const MAX_FILE_CHARS = 4_500;

const importantFilePatterns = [
  "package.json",
  "next.config",
  "tsconfig",
  "src/app/",
  "src/pages/",
  "src/components/",
  "src/lib/",
  "app/",
  "pages/",
  "components/",
  "lib/",
  "api/",
  "server/",
  "README",
];

const ignoredPathParts = [
  "node_modules/",
  ".next/",
  "dist/",
  "build/",
  "coverage/",
  ".git/",
  "package-lock.json",
  "pnpm-lock.yaml",
  "yarn.lock",
];

const languageByExtension: Record<string, string> = {
  ".ts": "TypeScript",
  ".tsx": "TSX",
  ".js": "JavaScript",
  ".jsx": "JSX",
  ".py": "Python",
  ".go": "Go",
  ".rs": "Rust",
  ".java": "Java",
  ".cs": "C#",
  ".rb": "Ruby",
  ".php": "PHP",
  ".md": "Markdown",
  ".json": "JSON",
  ".yml": "YAML",
  ".yaml": "YAML",
  ".sql": "SQL",
  ".css": "CSS",
};

type GitHubTreeItem = {
  path: string;
  type: "blob" | "tree";
};

type GitHubRepoResponse = {
  default_branch: string;
};

type GitHubTreeResponse = {
  tree: GitHubTreeItem[];
};

export function parseGitHubUrl(repoUrl: string) {
  const url = new URL(repoUrl);

  if (url.hostname !== "github.com") {
    throw new Error("Only github.com repository URLs are supported.");
  }

  const [owner, repo] = url.pathname.replace(/^\/|\/$/g, "").split("/");

  if (!owner || !repo) {
    throw new Error("Use a GitHub repository URL like https://github.com/owner/repo.");
  }

  return { owner, repo: repo.replace(/\.git$/, "") };
}

export async function scanGitHubRepository(repoUrl: string): Promise<RepoSnapshot> {
  const { owner, repo } = parseGitHubUrl(repoUrl);
  const repoApiUrl = `https://api.github.com/repos/${owner}/${repo}`;
  const repoResponse = await fetch(repoApiUrl, { headers: githubHeaders() });

  if (repoResponse.status === 403 || repoResponse.status === 429) {
    throw new Error("GitHub API rate limit exceeded. Please configure a GITHUB_TOKEN or wait before trying again.");
  }

  if (!repoResponse.ok) {
    throw new Error(`GitHub could not load ${owner}/${repo}.`);
  }

  const repoInfo = (await repoResponse.json()) as GitHubRepoResponse;
  const branch = repoInfo.default_branch;
  const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;
  const treeResponse = await fetch(treeUrl, { headers: githubHeaders() });

  if (treeResponse.status === 403 || treeResponse.status === 429) {
    throw new Error("GitHub API rate limit exceeded. Please configure a GITHUB_TOKEN or wait before trying again.");
  }

  if (!treeResponse.ok) {
    throw new Error("GitHub could not load the repository file tree.");
  }

  const treeData = (await treeResponse.json()) as GitHubTreeResponse;
  const tree = treeData.tree.map((item) => item.path).sort();
  const filesToRead = treeData.tree
    .filter((item) => item.type === "blob")
    .filter((item) => isUsefulTextFile(item.path))
    .sort((left, right) => scorePath(right.path) - scorePath(left.path))
    .slice(0, MAX_FILES);

  const files = await Promise.all(
    filesToRead.map(async (file) => {
      const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${file.path}`;
      const content = await fetchRawFile(rawUrl);

      return {
        path: file.path,
        language: detectLanguage(file.path),
        content: content.slice(0, MAX_FILE_CHARS),
      } satisfies RepoFile;
    }),
  );

  return {
    owner,
    repo,
    branch,
    url: `https://github.com/${owner}/${repo}`,
    files: files.filter((file) => file.content.trim().length > 0),
    tree: tree.slice(0, 90),
    techStack: detectTechStack(tree, files),
  };
}

function githubHeaders() {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  return headers;
}

async function fetchRawFile(rawUrl: string) {
  try {
    const response = await fetch(rawUrl);
    return response.ok ? await response.text() : "";
  } catch {
    return "";
  }
}

function isUsefulTextFile(path: string) {
  if (ignoredPathParts.some((part) => path.includes(part))) {
    return false;
  }

  const extension = path.match(/\.[^.]+$/)?.[0] ?? "";
  return extension in languageByExtension;
}

function scorePath(path: string) {
  const patternScore = importantFilePatterns.some((pattern) => path.includes(pattern)) ? 50 : 0;
  const depthPenalty = path.split("/").length;
  const configBoost = /package\.json|README|next\.config|tsconfig|pyproject|requirements/.test(path)
    ? 30
    : 0;

  return patternScore + configBoost - depthPenalty;
}

function detectLanguage(path: string) {
  const extension = path.match(/\.[^.]+$/)?.[0] ?? "";
  return languageByExtension[extension] ?? "Text";
}

function detectTechStack(tree: string[], files: RepoFile[]) {
  const joinedTree = tree.join("\n").toLowerCase();
  const packageJson = files.find((file) => file.path.endsWith("package.json"))?.content ?? "";
  const stack = new Set<string>();

  if (joinedTree.includes("next.config") || packageJson.includes("\"next\"")) stack.add("Next.js");
  if (packageJson.includes("\"react\"")) stack.add("React");
  if (joinedTree.includes("tailwind")) stack.add("Tailwind CSS");
  if (joinedTree.includes("drizzle")) stack.add("Drizzle ORM");
  if (joinedTree.includes("prisma")) stack.add("Prisma");
  if (joinedTree.includes("src/app/")) stack.add("App Router");
  if (joinedTree.includes("pyproject.toml") || joinedTree.includes("requirements.txt")) stack.add("Python");
  if (joinedTree.includes("fastapi")) stack.add("FastAPI");
  if (joinedTree.includes("dockerfile")) stack.add("Docker");
  if (joinedTree.includes(".github/workflows")) stack.add("GitHub Actions");

  return Array.from(stack);
}
