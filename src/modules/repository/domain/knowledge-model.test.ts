import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { scanRepositoryDirectory } from "../application/repo-scanner";
import { buildRepositoryKnowledgeModel } from "./knowledge-model";

const fixturesRoot = join(process.cwd(), "test", "fixtures", "repo-scanner");

describe("buildRepositoryKnowledgeModel", () => {
  it("maps scanner output to a normalized knowledge model for a single-package repo", async () => {
    const scan = await scanRepositoryDirectory(join(fixturesRoot, "single-package"));
    const model = buildRepositoryKnowledgeModel(scan);

    expect(model.repository.isMonorepo).toBe(false);
    expect(model.repository.rootPath).toContain("single-package");
    expect(model.packageFiles).toEqual(expect.arrayContaining(["package.json", "package-lock.json"]));
    expect(model.packageDependencies).toEqual(expect.arrayContaining(["next", "vitest"]));
    expect(model.packageJsonDevDependencies).toContain("vitest");
    expect(model.detectedLanguages).toEqual(expect.arrayContaining(["TypeScript"]));
    expect(model.detectedFrameworks).toEqual(expect.arrayContaining(["Next.js", "React", "Vitest"]));
    expect(model.signals.structure.hasAppDirectory).toBe(true);
    expect(model.evidence.database).toEqual(expect.arrayContaining(["prisma/schema.prisma"]));
    expect(model.evidence.framework).toEqual(expect.arrayContaining(["Next.js", "React"]));
  });

  it("maps scanner output for a monorepo fixture", async () => {
    const scan = await scanRepositoryDirectory(join(fixturesRoot, "monorepo"));
    const model = buildRepositoryKnowledgeModel(scan);

    expect(model.repository.isMonorepo).toBe(true);
    expect(model.structureSignals.isMonorepo).toBe(true);
    expect(model.packageManifests).toHaveLength(3);
    expect(model.signals.structure.isMonorepo).toBe(true);
    expect(model.evidence.files).toEqual(expect.arrayContaining(["apps", "packages"]));
  });
});
