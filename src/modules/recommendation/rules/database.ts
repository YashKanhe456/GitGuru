import type { RecommendationConstraints, RecommendationItem } from "../domain/types";
import type { NormalizedKnowledgeModel } from "../infrastructure/normalize-knowledge-model";
import { clampScore } from "./utils";

export function recommendDatabase(
  model: NormalizedKnowledgeModel,
  constraints: RecommendationConstraints,
): RecommendationItem {
  const relationalPreference = constraints.relationalPreference ?? "either";
  const relationalEvidence = [
    ...(model.evidence?.database ?? []),
    ...model.packageFiles.filter((file) => file.includes("prisma") || file.includes("schema")),
    ...model.filePaths.filter((path) => /schema|migration|sql|prisma/i.test(path)),
  ];

  const hasRelationalSignals =
    relationalPreference === "relational" ||
    relationalEvidence.length > 0 ||
    model.frameworks.some((framework) => /next|react|node/i.test(framework));

  const recommendedTechnology =
    relationalPreference === "nosql" ? "MongoDB" : hasRelationalSignals ? "PostgreSQL" : "PostgreSQL";

  const confidence = clampScore(
    recommendedTechnology === "PostgreSQL"
      ? 82 +
          (relationalPreference === "relational" ? 10 : 0) +
          (relationalEvidence.length > 0 ? 6 : 0) +
          (constraints.expectedTraffic === "high" ? 2 : 0)
      : 76 + (relationalPreference === "nosql" ? 8 : 0),
  );

  return {
    category: "Database",
    title: "Database",
    recommendedTechnology,
    confidence,
    reasoning:
      recommendedTechnology === "PostgreSQL"
        ? [
            "The repository shows relational-leaning application structure and config signals.",
            "PostgreSQL stays the safest default for transactions, constraints, and future analytics.",
            "It fits a modular SaaS foundation without locking the project into a niche database early.",
          ]
        : [
            "The user explicitly prefers NoSQL, so the engine keeps the recommendation aligned.",
            "A document model can work if the repository proves the domain is mostly unstructured.",
          ],
    repositoryEvidence: unique([
      ...(model.evidence?.database ?? []),
      ...relationalEvidence,
      ...model.packageFiles,
    ]),
    tradeoffs:
      recommendedTechnology === "PostgreSQL"
        ? [
            "Better consistency and relational modeling than MongoDB.",
            "Slightly more schema discipline than a schemaless database.",
          ]
        : [
            "Faster iteration for flexible documents.",
            "Weaker relational guarantees and more application-level validation.",
          ],
    alternatives:
      recommendedTechnology === "PostgreSQL" ? ["MySQL", "MongoDB"] : ["PostgreSQL", "MySQL"],
  };
}

function unique(values: string[]) {
  return values.filter((value, index) => values.indexOf(value) === index);
}
