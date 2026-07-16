import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { CloneRepositoryResult } from "../domain/repository";
import { scanRepositoryDirectory } from "./repo-scanner";
import { ingestRepository } from "./ingest-repository";

const fixturesRoot = join(process.cwd(), "test", "fixtures", "repo-scanner");

describe("ingestRepository", () => {
  it("builds a knowledge model after cloning a repository", async () => {
    const fixturePath = join(fixturesRoot, "single-package");
    const clone: CloneRepositoryResult = {
      repository: {
        url: "https://github.com/example/repository",
        owner: "example",
        name: "repository",
      },
      clonePath: fixturePath,
      clonedAt: "2026-01-01T00:00:00.000Z",
    };

    const result = await ingestRepository(
      { repoUrl: clone.repository.url },
      {
        clone: async () => clone,
        scan: scanRepositoryDirectory,
      },
    );

    expect(result.clone).toEqual(clone);
    expect(result.knowledgeModel.repository.rootPath).toBe(fixturePath);
    expect(result.knowledgeModel.detectedFrameworks).toContain("Next.js");
  });
});
