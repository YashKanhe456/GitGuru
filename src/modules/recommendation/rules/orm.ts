import type { RecommendationConstraints, RecommendationItem } from "../domain/types";
import type { NormalizedKnowledgeModel } from "../infrastructure/normalize-knowledge-model";
import { clampScore } from "./utils";

export function recommendOrm(
  model: NormalizedKnowledgeModel,
  constraints: RecommendationConstraints,
): RecommendationItem {
  const hasPrismaSignals = [
    ...model.packageDependencies,
    ...model.packageDevDependencies,
    ...model.packageFiles,
    ...model.filePaths,
  ].some((value) => /prisma/i.test(value));

  const recommendedTechnology = hasPrismaSignals || constraints.relationalPreference !== "nosql" ? "Prisma" : "Drizzle";

  const confidence = clampScore(
    recommendedTechnology === "Prisma"
      ? 85 + (hasPrismaSignals ? 10 : 0) + (constraints.experienceLevel === "beginner" ? 2 : 0)
      : 74 + (constraints.budget === "low" ? 4 : 0),
  );

  return {
    category: "ORM",
    title: "ORM",
    recommendedTechnology,
    confidence,
    reasoning:
      recommendedTechnology === "Prisma"
        ? [
            "Prisma is a strong fit when the repository already leans toward structured data and TypeScript.",
            "It reduces friction for schema-first development and future migrations.",
          ]
        : [
            "Drizzle is a lean option when the repository needs a lighter abstraction layer.",
            "It can suit low-budget, TypeScript-first projects that want more SQL control.",
          ],
    repositoryEvidence: unique([
      ...model.packageFiles,
      ...model.packageDependencies,
      ...model.packageDevDependencies,
      ...model.filePaths.filter((path) => /prisma/i.test(path)),
    ]),
    tradeoffs:
      recommendedTechnology === "Prisma"
        ? [
            "Excellent developer experience and migration flow.",
            "Can feel heavier than a thinner SQL-first ORM.",
          ]
        : [
            "More direct control over queries and smaller abstraction surface.",
            "Less ergonomic for teams that prefer schema-driven tooling.",
          ],
    alternatives: recommendedTechnology === "Prisma" ? ["Drizzle", "TypeORM"] : ["Prisma", "Kysely"],
  };
}

function unique(values: string[]) {
  return values.filter((value, index) => values.indexOf(value) === index);
}
