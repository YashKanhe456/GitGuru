import type { RepositoryKnowledgeModel } from "../../repository/domain/knowledge-model";

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord {
  return typeof value === "object" && value !== null ? (value as UnknownRecord) : {};
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function collectFilePaths(source: unknown): string[] {
  if (!Array.isArray(source)) {
    return [];
  }

  return source
    .flatMap((item) => {
      if (typeof item === "string") {
        return [item];
      }

      const record = asRecord(item);
      return typeof record.path === "string" ? [record.path] : [];
    })
    .filter((path, index, array) => array.indexOf(path) === index);
}

export type NormalizedKnowledgeModel = {
  filePaths: string[];
  languages: string[];
  frameworks: string[];
  packageFiles: string[];
  packageDependencies: string[];
  packageDevDependencies: string[];
  signals: Record<string, unknown>;
  evidence: RepositoryKnowledgeModel["evidence"];
};

export function normalizeKnowledgeModel(input: RepositoryKnowledgeModel): NormalizedKnowledgeModel {
  const record = asRecord(input);
  const signals = asRecord(record.signals);

  const filePaths = [...collectFilePaths(record.filePaths), ...collectFilePaths(record.files)];
  const packageDependencies = [
    ...asStringArray(record.packageDependencies),
    ...asStringArray(record.packageJsonDependencies),
    ...asStringArray(signals.dependencies),
  ];
  const packageDevDependencies = [
    ...asStringArray(record.packageJsonDevDependencies),
    ...asStringArray(signals.devDependencies),
  ];

  return {
    filePaths: unique(filePaths),
    languages: unique([
      ...asStringArray(record.detectedLanguages),
      ...asStringArray(record.languages),
      ...asStringArray(signals.languages),
    ]),
    frameworks: unique([
      ...asStringArray(record.detectedFrameworks),
      ...asStringArray(record.frameworks),
      ...asStringArray(signals.frameworks),
    ]),
    packageFiles: unique([
      ...asStringArray(record.packageFiles),
      ...asStringArray(signals.packageFiles),
    ]),
    packageDependencies: unique(packageDependencies),
    packageDevDependencies: unique(packageDevDependencies),
    signals,
    evidence: asRecord(record.evidence) as RepositoryKnowledgeModel["evidence"],
  };
}

function unique(values: string[]) {
  return values.filter((value, index) => values.indexOf(value) === index);
}
