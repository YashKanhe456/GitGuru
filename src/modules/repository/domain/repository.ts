export type GitHubRepositoryRef = {
  url: string;
  owner: string;
  name: string;
};

export type CloneRepositoryInput = {
  repoUrl: string;
  destinationRoot?: string;
  timeoutMs?: number;
};

export type CloneRepositoryResult = {
  repository: GitHubRepositoryRef;
  clonePath: string;
  clonedAt: string;
};
