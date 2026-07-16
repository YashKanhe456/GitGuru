import type { CloneRepositoryInput, CloneRepositoryResult } from "../domain/repository";
import {
  buildRepositoryKnowledgeModel,
  type RepositoryKnowledgeModel,
} from "../domain/knowledge-model";
import { scanRepositoryDirectory, type RepositoryScanResult } from "./repo-scanner";

export type RepositoryIngestionResult = {
  clone: CloneRepositoryResult;
  knowledgeModel: RepositoryKnowledgeModel;
};

export type RepositoryIngestionDependencies = {
  clone: (input: CloneRepositoryInput) => Promise<CloneRepositoryResult>;
  scan: (rootPath: string) => Promise<RepositoryScanResult>;
};

export async function ingestRepository(
  input: CloneRepositoryInput,
  dependencies?: Partial<RepositoryIngestionDependencies>,
): Promise<RepositoryIngestionResult> {
  const cloneRepository = dependencies?.clone ?? (await getCloneRepository());
  const scanRepository = dependencies?.scan ?? scanRepositoryDirectory;
  const clone = await cloneRepository(input);
  const scan = await scanRepository(clone.clonePath);

  return {
    clone,
    knowledgeModel: buildRepositoryKnowledgeModel(scan),
  };
}

async function getCloneRepository() {
  const { cloneRepository } = await import("./clone-repository");
  return cloneRepository;
}
