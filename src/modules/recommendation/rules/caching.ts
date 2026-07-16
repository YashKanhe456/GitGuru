import type { RecommendationConstraints, RecommendationItem } from "../domain/types";
import type { NormalizedKnowledgeModel } from "../infrastructure/normalize-knowledge-model";
import { clampScore } from "./utils";

export function recommendCaching(
  model: NormalizedKnowledgeModel,
  constraints: RecommendationConstraints,
): RecommendationItem {
  const highTraffic = constraints.expectedTraffic === "high";
  const mediumTraffic = constraints.expectedTraffic === "medium";
  const hasCacheSignals = [...model.filePaths, ...model.packageFiles].some((value) => /redis|cache|rate-limit/i.test(value));

  const recommendedTechnology =
    highTraffic || mediumTraffic || hasCacheSignals ? "Upstash Redis" : "Next.js Data Cache";

  const confidence = clampScore(
    recommendedTechnology === "Upstash Redis"
      ? 80 + (highTraffic ? 8 : 0) + (mediumTraffic ? 4 : 0) + (hasCacheSignals ? 4 : 0)
      : 78 + (constraints.budget === "low" ? 6 : 0),
  );

  return {
    category: "Caching",
    title: "Caching",
    recommendedTechnology,
    confidence,
    reasoning:
      recommendedTechnology === "Upstash Redis"
        ? [
            "The repository will benefit from shared cache and rate-limit storage once traffic grows.",
            "Upstash Redis is a low-friction managed option that fits modern web stacks.",
          ]
        : [
            "The repository does not yet show strong pressure for a separate cache service.",
            "Using the framework cache keeps the foundation simple and avoids unnecessary infrastructure.",
          ],
    repositoryEvidence: unique([
      ...model.filePaths.filter((path) => /cache|redis|rate-limit|middleware/i.test(path)),
      ...model.packageFiles,
    ]),
    tradeoffs:
      recommendedTechnology === "Upstash Redis"
        ? [
            "Adds a separate service but improves performance and throttling control.",
            "Can be introduced incrementally when traffic rises.",
          ]
        : [
            "Keeps costs low and architecture simple.",
            "May not be enough once shared cache or throttling becomes important.",
          ],
    alternatives:
      recommendedTechnology === "Upstash Redis"
        ? ["Redis on Render", "Valkey", "Next.js Data Cache"]
        : ["Upstash Redis", "Redis on Render", "Valkey"],
  };
}

function unique(values: string[]) {
  return values.filter((value, index) => values.indexOf(value) === index);
}
