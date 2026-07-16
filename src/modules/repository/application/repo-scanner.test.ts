import { describe, expect, it } from "vitest";
import { join } from "node:path";
import { scanRepositoryDirectory } from "./repo-scanner";

const fixturesRoot = join(process.cwd(), "test", "fixtures", "repo-scanner");

describe("scanRepositoryDirectory", () => {
  it("extracts raw facts from a single-package repo fixture", async () => {
    const result = await scanRepositoryDirectory(join(fixturesRoot, "single-package"));

    expect(result.structureSignals.isMonorepo).toBe(false);
    expect(result.structureSignals.hasSrcDirectory).toBe(true);
    expect(result.structureSignals.hasAppDirectory).toBe(true);
    expect(result.structureSignals.hasPagesDirectory).toBe(false);
    expect(result.structureSignals.packageJsonCount).toBeGreaterThan(0);
    expect(result.testSignals.hasTests).toBe(true);
    expect(result.testSignals.frameworks).toContain("vitest");
    expect(result.notableConfigFiles).toEqual(
      expect.arrayContaining(["package.json", "tsconfig.json", "eslint.config.mjs", "Dockerfile"]),
    );

    const rootManifest = result.packageManifests.find((manifest) => manifest.path === "package.json");
    expect(rootManifest?.dependencies).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "next", version: "15.5.20", section: "dependencies" }),
        expect.objectContaining({ name: "vitest", version: "^4.1.10", section: "devDependencies" }),
      ]),
    );
  });

  it("detects monorepo signals from workspace fixtures", async () => {
    const result = await scanRepositoryDirectory(join(fixturesRoot, "monorepo"));

    expect(result.structureSignals.isMonorepo).toBe(true);
    expect(result.structureSignals.workspacePackageJsonCount).toBeGreaterThan(0);
    expect(result.packageManifests).toHaveLength(3);
    expect(result.structureSignals.topLevelDirectories).toEqual(expect.arrayContaining(["apps", "packages"]));
  });
});
