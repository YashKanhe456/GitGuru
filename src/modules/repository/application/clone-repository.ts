import type { CloneRepositoryInput, CloneRepositoryResult } from "../domain/repository";
import { cloneGitHubRepository } from "../infrastructure/github-clone-service";

export async function cloneRepository(input: CloneRepositoryInput): Promise<CloneRepositoryResult> {
  return cloneGitHubRepository(input);
}
