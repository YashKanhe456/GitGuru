import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { scanRepositoryDirectory } from "../../repository/application/repo-scanner";
import { buildRepositoryKnowledgeModel } from "../../repository/domain/knowledge-model";
import { recommendEngineering } from "./recommend-engine";

const fixturePath = join(process.cwd(), "test", "fixtures", "repo-scanner", "single-package");

async function getRepositoryKnowledgeModel() {
  return buildRepositoryKnowledgeModel(await scanRepositoryDirectory(fixturePath));
}

describe("recommendEngineering", () => {
  it("returns structured technology recommendations from Vulcan's knowledge model", async () => {
    const result = recommendEngineering({
      repositoryKnowledgeModel: await getRepositoryKnowledgeModel(),
      constraints: {
        teamSize: 3,
        budget: "low",
        expectedTraffic: "medium",
        deploymentPreference: "serverless",
        relationalPreference: "relational",
        experienceLevel: "beginner",
      },
    });

    expect(result.recommendations).toHaveLength(8);
    expect(result.recommendations[0]).toMatchObject({
      category: "Database",
      recommendedTechnology: "PostgreSQL",
    });
    expect(result.recommendations[1]).toMatchObject({
      category: "ORM",
      recommendedTechnology: "Prisma",
    });
    expect(result.recommendations[3]).toMatchObject({
      category: "Deployment Platform",
      recommendedTechnology: "Vercel",
    });
  });

  it("keeps recommendations deterministic for noSQL preference", async () => {
    const result = recommendEngineering({
      repositoryKnowledgeModel: await getRepositoryKnowledgeModel(),
      constraints: {
        relationalPreference: "nosql",
        budget: "medium",
        expectedTraffic: "low",
        deploymentPreference: "traditional",
      },
    });

    const database = result.recommendations.find((item) => item.category === "Database");
    const deployment = result.recommendations.find((item) => item.category === "Deployment Platform");

    expect(database?.recommendedTechnology).toBe("MongoDB");
    expect(deployment?.recommendedTechnology).toBe("Render");
    expect(database?.confidence).toBeGreaterThan(0);
    expect(database?.repositoryEvidence.length).toBeGreaterThan(0);
  });
});
