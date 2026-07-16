export type PackageDependencySection = "dependencies" | "devDependencies" | "peerDependencies" | "optionalDependencies";

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

export type RepositoryKnowledgeEvidence = {
  database: string[];
  orm: string[];
  authentication: string[];
  deployment: string[];
  caching: string[];
  queue: string[];
  logging: string[];
  monitoring: string[];
  framework: string[];
  language: string[];
  files: string[];
  architecture: string[];
};

export type RepositoryKnowledgeModel = {
  repository: {
    rootPath: string;
    scannedAt: string;
    isMonorepo: boolean;
  };
  scan: {
    totalFiles: number;
    totalDirectories: number;
    totalBytes: number;
    maxDepth: number;
    extensionCounts: Record<string, number>;
  };
  filePaths: string[];
  directoryPaths: string[];
  notableConfigFiles: string[];
  packageManifests: RepositoryPackageManifest[];
  lockfiles: RepositoryLockfile[];
  packageFiles: string[];
  packageDependencies: string[];
  packageJsonDependencies: string[];
  packageJsonDevDependencies: string[];
  detectedLanguages: string[];
  detectedFrameworks: string[];
  testSignals: {
    hasTests: boolean;
    testFiles: string[];
    frameworks: string[];
  };
  structureSignals: {
    hasSrcDirectory: boolean;
    hasAppDirectory: boolean;
    hasPagesDirectory: boolean;
    packageJsonCount: number;
    packageLockCount: number;
    workspacePackageJsonCount: number;
    isMonorepo: boolean;
    topLevelDirectories: string[];
  };
  signals: {
    languages: string[];
    frameworks: string[];
    packageFiles: string[];
    dependencies: string[];
    devDependencies: string[];
    testFrameworks: string[];
    structure: {
      hasSrcDirectory: boolean;
      hasAppDirectory: boolean;
      hasPagesDirectory: boolean;
      isMonorepo: boolean;
    };
  };
  evidence: RepositoryKnowledgeEvidence;
};

export type RepositoryKnowledgeModelInput = {
  rootPath: string;
  scannedAt: string;
  totals: {
    totalFiles: number;
    totalDirectories: number;
    totalBytes: number;
    maxDepth: number;
  };
  filePaths: string[];
  directoryPaths: string[];
  extensionCounts: Record<string, number>;
  notableConfigFiles: string[];
  packageManifests: RepositoryPackageManifest[];
  lockfiles: RepositoryLockfile[];
  testSignals: {
    hasTests: boolean;
    testFiles: string[];
    frameworks: string[];
  };
  structureSignals: {
    hasSrcDirectory: boolean;
    hasAppDirectory: boolean;
    hasPagesDirectory: boolean;
    packageJsonCount: number;
    packageLockCount: number;
    workspacePackageJsonCount: number;
    isMonorepo: boolean;
    topLevelDirectories: string[];
  };
};

export function buildRepositoryKnowledgeModel(input: RepositoryKnowledgeModelInput): RepositoryKnowledgeModel {
  const packageFiles = input.packageManifests.map((manifest) => manifest.path).concat(input.lockfiles.map((lockfile) => lockfile.path));
  const packageJsonDependencies = input.packageManifests.flatMap((manifest) =>
    manifest.dependencies.filter((dependency) => dependency.section === "dependencies").map((dependency) => dependency.name),
  );
  const packageJsonDevDependencies = input.packageManifests.flatMap((manifest) =>
    manifest.dependencies.filter((dependency) => dependency.section === "devDependencies").map((dependency) => dependency.name),
  );
  const packageDependencies = unique([
    ...packageJsonDependencies,
    ...packageJsonDevDependencies,
    ...input.lockfiles.flatMap((lockfile) => lockfile.dependencies.map((dependency) => dependency.name)),
  ]);
  const detectedLanguages = inferLanguages(input.filePaths, input.extensionCounts);
  const detectedFrameworks = inferFrameworks(input);

  return {
    repository: {
      rootPath: input.rootPath,
      scannedAt: input.scannedAt,
      isMonorepo: input.structureSignals.isMonorepo,
    },
    scan: {
      totalFiles: input.totals.totalFiles,
      totalDirectories: input.totals.totalDirectories,
      totalBytes: input.totals.totalBytes,
      maxDepth: input.totals.maxDepth,
      extensionCounts: input.extensionCounts,
    },
    filePaths: input.filePaths,
    directoryPaths: input.directoryPaths,
    notableConfigFiles: input.notableConfigFiles,
    packageManifests: input.packageManifests,
    lockfiles: input.lockfiles,
    packageFiles,
    packageDependencies,
    packageJsonDependencies,
    packageJsonDevDependencies,
    detectedLanguages,
    detectedFrameworks,
    testSignals: input.testSignals,
    structureSignals: input.structureSignals,
    signals: {
      languages: detectedLanguages,
      frameworks: detectedFrameworks,
      packageFiles,
      dependencies: packageJsonDependencies,
      devDependencies: packageJsonDevDependencies,
      testFrameworks: input.testSignals.frameworks,
      structure: {
        hasSrcDirectory: input.structureSignals.hasSrcDirectory,
        hasAppDirectory: input.structureSignals.hasAppDirectory,
        hasPagesDirectory: input.structureSignals.hasPagesDirectory,
        isMonorepo: input.structureSignals.isMonorepo,
      },
    },
    evidence: buildEvidence({
      filePaths: input.filePaths,
      packageManifests: input.packageManifests,
      lockfiles: input.lockfiles,
      detectedLanguages,
      detectedFrameworks,
      testFrameworks: input.testSignals.frameworks,
      structureSignals: input.structureSignals,
    }),
  };
}

function inferLanguages(filePaths: string[], extensionCounts: Record<string, number>) {
  const result = new Set<string>();

  if ((extensionCounts[".ts"] ?? 0) + (extensionCounts[".tsx"] ?? 0) > 0) result.add("TypeScript");
  if ((extensionCounts[".js"] ?? 0) + (extensionCounts[".jsx"] ?? 0) > 0) result.add("JavaScript");
  if ((extensionCounts[".py"] ?? 0) > 0) result.add("Python");
  if ((extensionCounts[".go"] ?? 0) > 0) result.add("Go");
  if ((extensionCounts[".rs"] ?? 0) > 0) result.add("Rust");
  if ((extensionCounts[".java"] ?? 0) > 0) result.add("Java");
  if ((extensionCounts[".cs"] ?? 0) > 0) result.add("C#");
  if ((extensionCounts[".rb"] ?? 0) > 0) result.add("Ruby");
  if ((extensionCounts[".php"] ?? 0) > 0) result.add("PHP");
  if ((extensionCounts[".md"] ?? 0) > 0) result.add("Markdown");
  if ((extensionCounts[".sql"] ?? 0) > 0) result.add("SQL");
  if ((extensionCounts[".css"] ?? 0) > 0) result.add("CSS");

  const joinedFiles = filePaths.join("\n").toLowerCase();
  if (joinedFiles.includes("cargo.toml")) result.add("Rust");
  if (joinedFiles.includes("pyproject.toml") || joinedFiles.includes("requirements.txt")) result.add("Python");
  if (joinedFiles.includes("go.mod")) result.add("Go");

  return Array.from(result).sort();
}

function inferFrameworks(input: RepositoryKnowledgeModelInput) {
  const result = new Set<string>();
  const manifestBlob = input.packageManifests
    .flatMap((manifest) => [
      manifest.path,
      manifest.name ?? "",
      manifest.packageManager ?? "",
      ...manifest.scripts,
      ...manifest.dependencies.map((dependency) => dependency.name),
    ])
    .join("\n")
    .toLowerCase();
  const fileBlob = [...input.filePaths, ...input.notableConfigFiles].join("\n").toLowerCase();

  if (manifestBlob.includes("next") || fileBlob.includes("next.config") || fileBlob.includes("app/page")) result.add("Next.js");
  if (manifestBlob.includes("react")) result.add("React");
  if (manifestBlob.includes("prisma") || fileBlob.includes("prisma")) result.add("Prisma");
  if (manifestBlob.includes("drizzle") || fileBlob.includes("drizzle")) result.add("Drizzle ORM");
  if (manifestBlob.includes("tailwind") || fileBlob.includes("tailwind")) result.add("Tailwind CSS");
  if (manifestBlob.includes("vitest") || fileBlob.includes("vitest")) result.add("Vitest");
  if (manifestBlob.includes("jest") || fileBlob.includes("jest")) result.add("Jest");
  if (manifestBlob.includes("playwright") || fileBlob.includes("playwright")) result.add("Playwright");
  if (manifestBlob.includes("cypress") || fileBlob.includes("cypress")) result.add("Cypress");

  return Array.from(result).sort();
}

function buildEvidence(params: {
  filePaths: string[];
  packageManifests: RepositoryPackageManifest[];
  lockfiles: RepositoryLockfile[];
  detectedLanguages: string[];
  detectedFrameworks: string[];
  testFrameworks: string[];
  structureSignals: RepositoryKnowledgeModelInput["structureSignals"];
}): RepositoryKnowledgeEvidence {
  const filePaths = params.filePaths;
  const packagePaths = params.packageManifests.map((manifest) => manifest.path);
  const lockfilePaths = params.lockfiles.map((lockfile) => lockfile.path);
  const dependencyNames = params.packageManifests.flatMap((manifest) => manifest.dependencies.map((dependency) => dependency.name));
  const languageEvidence = unique([
    ...params.detectedLanguages,
    ...filePaths.filter((path) => /\.(ts|tsx|js|jsx|py|go|rs|java|cs|rb|php|sql|css|md)$/i.test(path)),
  ]);

  return {
    database: unique([
      ...filePaths.filter((path) => /prisma|schema|migration|sql|postgres|postgresql|mysql|sqlite/i.test(path)),
      ...dependencyNames.filter((name) => /prisma|drizzle|typeorm|kysely|pg/i.test(name)),
    ]),
    orm: unique([
      ...filePaths.filter((path) => /prisma|drizzle|typeorm|kysely/i.test(path)),
      ...dependencyNames.filter((name) => /prisma|drizzle|typeorm|kysely/i.test(name)),
    ]),
    authentication: unique([
      ...filePaths.filter((path) => /auth|login|signin|signup|session|clerk|nextauth|supabase/i.test(path)),
      ...dependencyNames.filter((name) => /auth|clerk|nextauth|supabase/i.test(name)),
    ]),
    deployment: unique([
      ...filePaths.filter((path) => /vercel|render|fly|docker|docker-compose|github\/workflows/i.test(path)),
      ...dependencyNames.filter((name) => /vercel|render|fly|docker/i.test(name)),
    ]),
    caching: unique([
      ...filePaths.filter((path) => /cache|redis|upstash/i.test(path)),
      ...dependencyNames.filter((name) => /redis|upstash|cache/i.test(name)),
    ]),
    queue: unique([
      ...filePaths.filter((path) => /queue|worker|cron|job|background/i.test(path)),
      ...dependencyNames.filter((name) => /bull|queue|worker|cron|job/i.test(name)),
    ]),
    logging: unique([
      ...filePaths.filter((path) => /log|logger|pino|winston/i.test(path)),
      ...dependencyNames.filter((name) => /pino|winston|logger|log/i.test(name)),
    ]),
    monitoring: unique([
      ...filePaths.filter((path) => /monitor|observability|sentry|telemetry|otel/i.test(path)),
      ...dependencyNames.filter((name) => /sentry|otel|telemetry|observability/i.test(name)),
    ]),
    framework: unique([
      ...params.detectedFrameworks,
      ...dependencyNames.filter((name) => /next|react|vue|svelte|express|fastify|nestjs|django|flask|rails|spring/i.test(name)),
      ...filePaths.filter((path) => /src\/app|app\/page|pages\//i.test(path)),
    ]),
    language: languageEvidence,
    files: unique([
      ...params.structureSignals.topLevelDirectories,
      ...params.structureSignals.hasSrcDirectory ? ["src/"] : [],
      ...params.structureSignals.hasAppDirectory ? ["app/"] : [],
      ...params.structureSignals.hasPagesDirectory ? ["pages/"] : [],
      ...params.testFrameworks,
      ...packagePaths,
      ...lockfilePaths,
    ]),
    architecture: unique([
      ...(params.structureSignals.hasSrcDirectory ? ["src/ layout"] : []),
      ...(params.structureSignals.hasAppDirectory ? ["app router"] : []),
      ...(params.structureSignals.hasPagesDirectory ? ["pages router"] : []),
      ...(params.structureSignals.isMonorepo ? ["monorepo"] : []),
      ...(params.structureSignals.workspacePackageJsonCount > 0 ? ["workspace packages"] : []),
      ...filePaths.filter((path) => /src\/app|src\/pages|packages\/|apps\//i.test(path)).slice(0, 12),
    ]),
  };
}

function unique(values: string[]) {
  return values.filter((value, index) => values.indexOf(value) === index);
}
