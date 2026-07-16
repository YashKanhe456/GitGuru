import type { RecommendationConstraints, RecommendationItem } from "../domain/types";
import type { NormalizedKnowledgeModel } from "../infrastructure/normalize-knowledge-model";
import { clampScore } from "./utils";

export function recommendLogging(
  model: NormalizedKnowledgeModel,
  constraints: RecommendationConstraints,
): RecommendationItem {
  const hasStructuredSignals = [...model.filePaths, ...model.packageFiles].some((value) => /logger|log|observability/i.test(value));

  const recommendedTechnology = constraints.budget === "low" ? "Pino" : "Pino + OpenTelemetry";
  const confidence = clampScore(
    recommendedTechnology === "Pino"
      ? 83 + (hasStructuredSignals ? 6 : 0)
      : 80 + (constraints.expectedTraffic !== "low" ? 4 : 0),
  );

  return {
    category: "Logging",
    title: "Logging",
    recommendedTechnology,
    confidence,
    reasoning:
      recommendedTechnology === "Pino"
        ? [
            "Pino keeps logging fast, simple, and JSON-friendly for Node services.",
            "It is a low-cost baseline that works well during early product stages.",
          ]
        : [
            "Pino plus OpenTelemetry gives structured logs and trace correlation.",
            "It is a better fit once the system has more services and cross-service debugging.",
          ],
    repositoryEvidence: unique([
      ...model.filePaths.filter((path) => /log|logger|observability/i.test(path)),
      ...model.packageFiles,
    ]),
    tradeoffs:
      recommendedTechnology === "Pino"
        ? [
            "Minimal setup and great runtime performance.",
            "Less visibility across services than a full observability stack.",
          ]
        : [
            "Improves tracing and debugging across modules.",
            "Adds some setup overhead compared with plain structured logs.",
          ],
    alternatives: recommendedTechnology === "Pino" ? ["Winston", "Bunyan"] : ["Winston", "Datadog Logs"],
  };
}

function unique(values: string[]) {
  return values.filter((value, index) => values.indexOf(value) === index);
}
