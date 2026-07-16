import "server-only";
import { extname } from "node:path";
import { env } from "@/core/env";
import type {
  RepositoryKnowledgeModelInput,
  RepositoryLockfile,
  RepositoryPackageDependency,
  RepositoryPackageManifest,
} from "../domain/knowledge-model";
import { parseGitHubRepositoryUrl } from "./github";

const MAX_TREE_FILES = 2_000;
const MAX_MANIFEST_FILES = 20;
const TEST_FILE_PATTERN = /\.(test|spec)\.[^.]+$/i;
const TEST_DIRECTORY_PATTERN = /(^|\/)(test|tests|__tests__)(\/|$)/i;
const NOTABLE_CONFIG_PATTERN = /(^|\/)(package(-lock)?\.json|pnpm-lock\.yaml|yarn\.lock|bun\.lockb|tsconfig\.json|jsconfig\.json|Dockerfile|docker-compose\.ya?ml|vitest\.config\.[cm]?[jt]s|jest\.config\.[cm]?[jt]s|playwright\.config\.[cm]?[jt]s|eslint\.config\.[cm]?[jt]s|\.github\/workflows\/[^/]+\.ya?ml)$/i;

type GitHubRepositoryResponse = {
  default_branch?: string;
  private?: boolean;
  archived?: boolean;
  fork?: boolean;
};

type GitHubTreeEntry = {
  path: string;
  type: "blob" | "tree" | "commit";
  size?: number;
};

type GitHubTreeResponse = {
  truncated?: boolean;
  tree?: GitHubTreeEntry[];
};

export type GitHubRepositoryInspection = {
  repository: {
    url: string;
    owner: string;
    name: string;
    defaultBranch: string;
    isPrivate: boolean;
    isArchived: boolean;
    isFork: boolean;
  };
  knowledgeModelInput: RepositoryKnowledgeModelInput;
  truncated: boolean;
};

export class RepositoryInspectionError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export async function inspectGitHubRepository(repoUrl: string): Promise<GitHubRepositoryInspection> {
  const repository = parseGitHubRepositoryUrl(repoUrl);
  const repositoryResponse = await getGitHubJson<GitHubRepositoryResponse>(
    `https://api.github.com/repos/${repository.owner}/${repository.name}`,
  );
  const defaultBranch = repositoryResponse.default_branch;

  if (!defaultBranch) {
    throw new RepositoryInspectionError("GitHub did not return a default branch for this repository.", 422);
  }

  const treeResponse = await getGitHubJson<GitHubTreeResponse>(
    `https://api.github.com/repos/${repository.owner}/${repository.name}/git/trees/${encodeURIComponent(defaultBranch)}?recursive=1`,
  );
  const entries = (treeResponse.tree ?? []).filter((entry) => entry.type === "blob").slice(0, MAX_TREE_FILES);
  const filePaths = entries.map((entry) => entry.path).sort();
  const directoryPaths = getDirectoryPaths(filePaths);
  const packageJsonPaths = filePaths.filter((path) => path.endsWith("package.json")).slice(0, MAX_MANIFEST_FILES);
  const lockfilePaths = filePaths
    .filter((path) => /(^|\/)(package-lock\.json|pnpm-lock\.yaml|yarn\.lock)$/i.test(path))
    .slice(0, MAX_MANIFEST_FILES);
  const [packageManifests, lockfiles] = await Promise.all([
    readPackageManifests(repository, defaultBranch, packageJsonPaths),
    readLockfiles(repository, defaultBranch, lockfilePaths),
  ]);
  const extensionCounts = getExtensionCounts(filePaths);
  const topLevelDirectories = Array.from(new Set(directoryPaths.map((path) => path.split("/")[0]).filter(Boolean))).sort();
  const testFrameworks = detectTestFrameworks(packageManifests, filePaths);
  const workspacePackageJsonCount = packageManifests.filter((manifest) => manifest.path !== "package.json").length;
  const isMonorepo =
    packageManifests.some((manifest) => manifest.workspaces.length > 0) ||
    workspacePackageJsonCount > 0 ||
    topLevelDirectories.includes("apps") ||
    topLevelDirectories.includes("packages");

  return {
    repository: {
      ...repository,
      defaultBranch,
      isPrivate: repositoryResponse.private ?? false,
      isArchived: repositoryResponse.archived ?? false,
      isFork: repositoryResponse.fork ?? false,
    },
    knowledgeModelInput: {
      rootPath: repository.url,
      scannedAt: new Date().toISOString(),
      totals: {
        totalFiles: entries.length,
        totalDirectories: directoryPaths.length,
        totalBytes: entries.reduce((total, entry) => total + (entry.size ?? 0), 0),
        maxDepth: Math.max(0, ...filePaths.map((path) => path.split("/").length - 1)),
      },
      filePaths,
      directoryPaths,
      extensionCounts,
      notableConfigFiles: filePaths.filter((path) => NOTABLE_CONFIG_PATTERN.test(path)),
      packageManifests,
      lockfiles,
      testSignals: {
        hasTests: filePaths.some((path) => TEST_FILE_PATTERN.test(path) || TEST_DIRECTORY_PATTERN.test(path)) || testFrameworks.length > 0,
        testFiles: filePaths.filter((path) => TEST_FILE_PATTERN.test(path) || TEST_DIRECTORY_PATTERN.test(path)).slice(0, 100),
        frameworks: testFrameworks,
      },
      structureSignals: {
        hasSrcDirectory: topLevelDirectories.includes("src"),
        hasAppDirectory: filePaths.some((path) => path.startsWith("app/") || path.startsWith("src/app/")),
        hasPagesDirectory: filePaths.some((path) => path.startsWith("pages/") || path.startsWith("src/pages/")),
        packageJsonCount: packageJsonPaths.length,
        packageLockCount: lockfilePaths.length,
        workspacePackageJsonCount,
        isMonorepo,
        topLevelDirectories,
      },
    },
    truncated: treeResponse.truncated === true || (treeResponse.tree?.length ?? 0) > MAX_TREE_FILES,
  };
}

async function readPackageManifests(
  repository: { owner: string; name: string },
  branch: string,
  paths: string[],
): Promise<RepositoryPackageManifest[]> {
  const results = await Promise.allSettled(paths.map((path) => getRawFile(repository, branch, path)));

  return results.flatMap((result, index) => {
    if (result.status !== "fulfilled") return [];

    try {
      const parsed = JSON.parse(result.value) as Record<string, unknown>;
      return [
        {
          path: paths[index],
          name: typeof parsed.name === "string" ? parsed.name : undefined,
          version: typeof parsed.version === "string" ? parsed.version : undefined,
          packageManager: typeof parsed.packageManager === "string" ? parsed.packageManager : undefined,
          scripts: asRecord(parsed.scripts) ? Object.keys(asRecord(parsed.scripts)) : [],
          dependencies: [
            ...extractDependencies(parsed, "dependencies"),
            ...extractDependencies(parsed, "devDependencies"),
            ...extractDependencies(parsed, "peerDependencies"),
            ...extractDependencies(parsed, "optionalDependencies"),
          ],
          workspaces: extractWorkspaces(parsed),
        },
      ];
    } catch {
      return [];
    }
  });
}

async function readLockfiles(
  repository: { owner: string; name: string },
  branch: string,
  paths: string[],
): Promise<RepositoryLockfile[]> {
  const results = await Promise.allSettled(paths.map((path) => getRawFile(repository, branch, path)));

  return results.flatMap((result, index) => {
    if (result.status !== "fulfilled" || !paths[index].endsWith("package-lock.json")) return [];

    try {
      const parsed = JSON.parse(result.value) as Record<string, unknown>;
      const packages = asRecord(parsed.packages);
      return [{
        path: paths[index],
        lockfileVersion: typeof parsed.lockfileVersion === "number" ? parsed.lockfileVersion : undefined,
        dependencies: Object.entries(packages)
          .filter(([name]) => name !== "")
          .map(([name, value]) => ({
            name: name.split("node_modules/").pop() ?? name,
            version: typeof asRecord(value).version === "string" ? asRecord(value).version as string : undefined,
          })),
      }];
    } catch {
      return [];
    }
  });
}

async function getGitHubJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { headers: getGitHubHeaders(), cache: "no-store" });
  if (!response.ok) throw await toInspectionError(response);
  return response.json() as Promise<T>;
}

async function getRawFile(repository: { owner: string; name: string }, branch: string, path: string) {
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  const response = await fetch(
    `https://raw.githubusercontent.com/${repository.owner}/${repository.name}/${encodeURIComponent(branch)}/${encodedPath}`,
    { headers: getGitHubHeaders(), cache: "no-store" },
  );
  if (!response.ok) throw await toInspectionError(response);
  return response.text();
}

function getGitHubHeaders() {
  return {
    Accept: "application/vnd.github+json",
    "User-Agent": "Vulcan-Engineering-Review",
    ...(env.GITHUB_TOKEN ? { Authorization: `Bearer ${env.GITHUB_TOKEN}` } : {}),
  };
}

async function toInspectionError(response: Response) {
  const body = await response.json().catch(() => null) as { message?: string } | null;
  if (response.status === 403 || response.status === 429) {
    return new RepositoryInspectionError("GitHub request limit reached. Add GITHUB_TOKEN in your deployment environment and retry.", 429);
  }
  if (response.status === 404) return new RepositoryInspectionError("Repository not found or is not accessible with the configured token.", 404);
  return new RepositoryInspectionError(body?.message ?? "GitHub could not inspect this repository.", response.status);
}

function getDirectoryPaths(filePaths: string[]) {
  const directories = new Set<string>();
  for (const filePath of filePaths) {
    const parts = filePath.split("/");
    parts.pop();
    while (parts.length > 0) {
      directories.add(parts.join("/"));
      parts.pop();
    }
  }
  return Array.from(directories).sort();
}

function getExtensionCounts(filePaths: string[]) {
  return filePaths.reduce<Record<string, number>>((counts, path) => {
    const extension = extname(path).toLowerCase() || "[no extension]";
    counts[extension] = (counts[extension] ?? 0) + 1;
    return counts;
  }, {});
}

function extractDependencies(parsed: Record<string, unknown>, section: RepositoryPackageDependency["section"]) {
  const dependencies = asRecord(parsed[section]);
  return Object.entries(dependencies).flatMap(([name, version]) =>
    typeof version === "string" ? [{ name, version, section }] : [],
  );
}

function extractWorkspaces(parsed: Record<string, unknown>) {
  const workspaces = parsed.workspaces;
  if (Array.isArray(workspaces)) return workspaces.filter((workspace): workspace is string => typeof workspace === "string");
  const packages = asRecord(workspaces).packages;
  return Array.isArray(packages) ? packages.filter((workspace): workspace is string => typeof workspace === "string") : [];
}

function detectTestFrameworks(manifests: RepositoryPackageManifest[], filePaths: string[]) {
  const values = manifests.flatMap((manifest) => [
    ...manifest.scripts,
    ...manifest.dependencies.map((dependency) => dependency.name.toLowerCase()),
  ]);
  const files = filePaths.join("\n").toLowerCase();
  return ["vitest", "jest", "playwright", "cypress", "mocha"]
    .filter((framework) => values.some((value) => value.includes(framework)) || files.includes(framework))
    .sort();
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? value as Record<string, unknown> : {};
}
