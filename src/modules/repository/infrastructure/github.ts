import { URL } from "node:url";
import type { GitHubRepositoryRef } from "../domain/repository";

export function parseGitHubRepositoryUrl(repoUrl: string): GitHubRepositoryRef {
  const url = new URL(repoUrl);

  if (url.hostname !== "github.com") {
    throw new Error("Only GitHub repository URLs are supported.");
  }

  const pathParts = url.pathname.replace(/^\/|\/$/g, "").split("/");
  const [owner, name] = pathParts;

  if (!owner || !name || pathParts.length !== 2) {
    throw new Error("Use a GitHub repository URL like https://github.com/owner/repo.");
  }

  return {
    url: `https://github.com/${owner}/${name.replace(/\.git$/, "")}`,
    owner,
    name: name.replace(/\.git$/, ""),
  };
}

export function toCloneTarget(repoUrl: string) {
  const repository = parseGitHubRepositoryUrl(repoUrl);

  return {
    repository,
    cloneUrl: `${repository.url}.git`,
    directoryName: `${repository.owner}-${repository.name}`.toLowerCase(),
  };
}
