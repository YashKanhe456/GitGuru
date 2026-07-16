import { readFile, readdir, stat } from "node:fs/promises";
import { extname, join, relative } from "node:path";

const IGNORED_DIRECTORIES = new Set(["node_modules", ".git", ".next", "dist", "build", "coverage"]);
const DEFAULT_MAX_FILE_COUNT = 2000;
const DEFAULT_MAX_FILE_BYTES = 1_048_576;

const NOTABLE_CONFIG_NAMES = new Set([
  "package.json",
  "package-lock.json",
  "pnpm-lock.yaml",
  "yarn.lock",
  "bun.lockb",
  "tsconfig.json",
  "jsconfig.json",
  "eslint.config.mjs",
  "eslint.config.js",
  ".eslintrc",
  ".eslintrc.json",
  ".eslintrc.js",
  ".prettierrc",
  ".prettierrc.json",
  ".gitignore",
  "Dockerfile",
  "docker-compose.yml",
  "docker-compose.yaml",
  "vitest.config.ts",
  "vitest.config.js",
  "jest.config.js",
  "jest.config.ts",
  "playwright.config.ts",
  "playwright.config.js",
]);

const TEST_FILE_PATTERN = /\.(test|spec)\.[^.]+$/i;
const TEST_DIR_PATTERN = /(^|\/|\\)(test|tests|__tests__)(\/|\\|$)/i;

type FileStats = {
  totalFiles: number;
  totalDirectories: number;
  totalBytes: number;
  maxDepth: number;
};

type PackageDependencySection = "dependencies" | "devDependencies" | "peerDependencies" | "optionalDependencies";

export type RepositoryPackageDependency = {
  name: string;
  version: string;
  section: PackageDependencySection;
};

export type RepositoryPackageManifest = {
  path: string;
  name?: string;
  version?: string;
  packageManager?: string;
  scripts: string[];
  dependencies: RepositoryPackageDependency[];
  workspaces: string[];
};

export type RepositoryLockDependency = {
  name: string;
  version?: string;
};

export type RepositoryLockfile = {
  path: string;
  lockfileVersion?: number;
  dependencies: RepositoryLockDependency[];
};

export type RepositoryTestSignals = {
  hasTests: boolean;
  testFiles: string[];
  frameworks: string[];
};

export type RepositoryStructureSignals = {
  hasSrcDirectory: boolean;
  hasAppDirectory: boolean;
  hasPagesDirectory: boolean;
  packageJsonCount: number;
  packageLockCount: number;
  workspacePackageJsonCount: number;
  isMonorepo: boolean;
  topLevelDirectories: string[];
};

export type RepositoryScanResult = {
  rootPath: string;
  scannedAt: string;
  totals: FileStats;
  filePaths: string[];
  directoryPaths: string[];
  extensionCounts: Record<string, number>;
  notableConfigFiles: string[];
  packageManifests: RepositoryPackageManifest[];
  lockfiles: RepositoryLockfile[];
  testSignals: RepositoryTestSignals;
  structureSignals: RepositoryStructureSignals;
  truncated: {
    files: boolean;
    oversizedFiles: boolean;
  };
};

export type ScanRepositoryOptions = {
  maxFileCount?: number;
  maxFileSizeBytes?: number;
};

export async function scanRepositoryDirectory(
  rootPath: string,
  options: ScanRepositoryOptions = {},
): Promise<RepositoryScanResult> {
  const maxFileCount = options.maxFileCount ?? DEFAULT_MAX_FILE_COUNT;
  const maxFileSizeBytes = options.maxFileSizeBytes ?? DEFAULT_MAX_FILE_BYTES;

  const filePaths: string[] = [];
  const directoryPaths: string[] = [];
  const notableConfigFiles: string[] = [];
  const packageManifests: RepositoryPackageManifest[] = [];
  const lockfiles: RepositoryLockfile[] = [];
  const testFiles: string[] = [];
  const oversizedFiles: string[] = [];
  const extensionCounts: Record<string, number> = {};
  const topLevelDirectories = new Set<string>();
  const packageJsonPaths: string[] = [];
  const packageLockPaths: string[] = [];

  const totals: FileStats = {
    totalFiles: 0,
    totalDirectories: 0,
    totalBytes: 0,
    maxDepth: 0,
  };

  async function walk(currentPath: string, depth = 0): Promise<void> {
    const entries = await readdir(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      if (IGNORED_DIRECTORIES.has(entry.name)) {
        continue;
      }

      const absolutePath = join(currentPath, entry.name);
      const relativePath = relative(rootPath, absolutePath).replaceAll("\\", "/");

      if (entry.isDirectory()) {
        totals.totalDirectories += 1;
        totals.maxDepth = Math.max(totals.maxDepth, depth + 1);
        directoryPaths.push(relativePath);

        const topLevelSegment = relativePath.split("/")[0];
        if (topLevelSegment) {
          topLevelDirectories.add(topLevelSegment);
        }

        await walk(absolutePath, depth + 1);
        continue;
      }

      totals.totalFiles += 1;
      totals.maxDepth = Math.max(totals.maxDepth, depth);
      filePaths.push(relativePath);

      const extension = extname(entry.name).toLowerCase() || "[no extension]";
      extensionCounts[extension] = (extensionCounts[extension] ?? 0) + 1;

      if (NOTABLE_CONFIG_NAMES.has(entry.name) || /\.(config\.[cm]?[jt]s|ya?ml)$/i.test(entry.name)) {
        notableConfigFiles.push(relativePath);
      }

      if (entry.name === "package.json") {
        packageJsonPaths.push(absolutePath);
      }

      if (entry.name === "package-lock.json" || entry.name === "pnpm-lock.yaml" || entry.name === "yarn.lock") {
        packageLockPaths.push(absolutePath);
      }

      if (testFiles.length < maxFileCount && isTestFile(relativePath)) {
        testFiles.push(relativePath);
      }

      const fileStat = await stat(absolutePath);
      totals.totalBytes += fileStat.size;

      if (fileStat.size > maxFileSizeBytes) {
        oversizedFiles.push(relativePath);
      }
    }
  }

  await walk(rootPath);

  for (const packagePath of packageJsonPaths.slice(0, maxFileCount)) {
    const manifest = await readPackageManifest(packagePath, rootPath);
    packageManifests.push(manifest);
  }

  for (const lockfilePath of packageLockPaths.slice(0, maxFileCount)) {
    const lockfile = await readLockfile(lockfilePath, rootPath);
    lockfiles.push(lockfile);
  }

  const testFrameworks = detectTestFrameworks(packageManifests, filePaths, lockfiles);
  const workspacePackageJsonCount = packageManifests.filter((manifest) => manifest.path !== "package.json").length;
  const isMonorepo =
    packageManifests.some((manifest) => manifest.workspaces.length > 0) ||
    workspacePackageJsonCount > 0 ||
    topLevelDirectories.has("packages") ||
    topLevelDirectories.has("apps");

  return {
    rootPath,
    scannedAt: new Date().toISOString(),
    totals,
    filePaths: filePaths.slice(0, maxFileCount),
    directoryPaths,
    extensionCounts,
    notableConfigFiles,
    packageManifests,
    lockfiles,
    testSignals: {
      hasTests: testFiles.length > 0 || testFrameworks.length > 0,
      testFiles,
      frameworks: testFrameworks,
    },
    structureSignals: {
      hasSrcDirectory: topLevelDirectories.has("src"),
      hasAppDirectory: filePaths.some((path) => path.startsWith("src/app/") || path.startsWith("app/")),
      hasPagesDirectory: filePaths.some((path) => path.startsWith("src/pages/") || path.startsWith("pages/")),
      packageJsonCount: packageJsonPaths.length,
      packageLockCount: packageLockPaths.length,
      workspacePackageJsonCount,
      isMonorepo,
      topLevelDirectories: Array.from(topLevelDirectories).sort(),
    },
    truncated: {
      files: totals.totalFiles > maxFileCount,
      oversizedFiles: oversizedFiles.length > 0,
    },
  };
}

async function readPackageManifest(packagePath: string, rootPath: string): Promise<RepositoryPackageManifest> {
  const raw = await readFile(packagePath, "utf8");
  const parsed = JSON.parse(raw) as Record<string, unknown>;
  const dependencies = extractDependencies(parsed, "dependencies");
  const devDependencies = extractDependencies(parsed, "devDependencies");
  const peerDependencies = extractDependencies(parsed, "peerDependencies");
  const optionalDependencies = extractDependencies(parsed, "optionalDependencies");
  const workspaces = extractWorkspaces(parsed);

  return {
    path: relative(rootPath, packagePath).replaceAll("\\", "/"),
    name: typeof parsed.name === "string" ? parsed.name : undefined,
    version: typeof parsed.version === "string" ? parsed.version : undefined,
    packageManager: typeof parsed.packageManager === "string" ? parsed.packageManager : undefined,
    scripts: parsed.scripts && typeof parsed.scripts === "object" ? Object.keys(parsed.scripts as Record<string, unknown>) : [],
    dependencies: [...dependencies, ...devDependencies, ...peerDependencies, ...optionalDependencies],
    workspaces,
  };
}

async function readLockfile(lockfilePath: string, rootPath: string): Promise<RepositoryLockfile> {
  const relativePath = relative(rootPath, lockfilePath).replaceAll("\\", "/");

  if (relativePath.endsWith(".json")) {
    const raw = await readFile(lockfilePath, "utf8");
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const packages = parsed.packages && typeof parsed.packages === "object" ? (parsed.packages as Record<string, unknown>) : {};
    const dependencies = extractLockDependencies(parsed, packages);

    return {
      path: relativePath,
      lockfileVersion: typeof parsed.lockfileVersion === "number" ? parsed.lockfileVersion : undefined,
      dependencies,
    };
  }

  return {
    path: relativePath,
    dependencies: [],
  };
}

function extractDependencies(parsed: Record<string, unknown>, key: PackageDependencySection) {
  const source = parsed[key];
  if (!source || typeof source !== "object") {
    return [];
  }

  return Object.entries(source as Record<string, unknown>).flatMap(([name, version]) =>
    typeof version === "string" ? [{ name, version, section: key }] : [],
  );
}

function extractWorkspaces(parsed: Record<string, unknown>) {
  const workspaces = parsed.workspaces;

  if (Array.isArray(workspaces)) {
    return workspaces.filter((item): item is string => typeof item === "string");
  }

  if (workspaces && typeof workspaces === "object") {
    const record = workspaces as Record<string, unknown>;
    const patterns = record.packages;
    if (Array.isArray(patterns)) {
      return patterns.filter((item): item is string => typeof item === "string");
    }
  }

  return [];
}

function extractLockDependencies(parsed: Record<string, unknown>, packages: Record<string, unknown>): RepositoryLockDependency[] {
  if (packages && Object.keys(packages).length > 0) {
    return Object.entries(packages)
      .filter(([key]) => key !== "")
      .map(([key, value]) => ({
        name: key.split("node_modules/").pop() ?? key,
        version: typeof (value as Record<string, unknown>).version === "string" ? (value as Record<string, unknown>).version as string : undefined,
      }));
  }

  const dependencies = parsed.dependencies && typeof parsed.dependencies === "object" ? (parsed.dependencies as Record<string, unknown>) : {};
  return Object.entries(dependencies).flatMap(([name, value]) => {
    if (!value || typeof value !== "object") {
      return [];
    }

    const record = value as Record<string, unknown>;
    return [
      {
        name,
        version: typeof record.version === "string" ? record.version : undefined,
      },
    ];
  });
}

function detectTestFrameworks(
  manifests: RepositoryPackageManifest[],
  filePaths: string[],
  lockfiles: RepositoryLockfile[],
) {
  const detected = new Set<string>();
  const names = [
    ...manifests.flatMap((manifest) => manifest.dependencies.map((dependency) => dependency.name.toLowerCase())),
    ...manifests.flatMap((manifest) => manifest.scripts),
    ...lockfiles.flatMap((lockfile) => lockfile.dependencies.map((dependency) => dependency.name.toLowerCase())),
  ];
  const pathBlob = filePaths.join("\n").toLowerCase();

  if (names.some((value) => value.includes("vitest")) || pathBlob.includes("vitest")) detected.add("vitest");
  if (names.some((value) => value.includes("jest")) || pathBlob.includes("jest")) detected.add("jest");
  if (names.some((value) => value.includes("mocha")) || pathBlob.includes("mocha")) detected.add("mocha");
  if (names.some((value) => value.includes("playwright")) || pathBlob.includes("playwright")) detected.add("playwright");
  if (names.some((value) => value.includes("cypress")) || pathBlob.includes("cypress")) detected.add("cypress");
  if (names.some((value) => value.includes("bun:test")) || pathBlob.includes("bun:test")) detected.add("bun:test");

  return Array.from(detected).sort();
}

function isTestFile(relativePath: string) {
  return TEST_FILE_PATTERN.test(relativePath) || TEST_DIR_PATTERN.test(relativePath);
}
