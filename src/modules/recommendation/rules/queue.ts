import type { RecommendationConstraints, RecommendationItem } from "../domain/types";
import type { NormalizedKnowledgeModel } from "../infrastructure/normalize-knowledge-model";
import { clampScore } from "./utils";

export function recommendQueue(
  model: NormalizedKnowledgeModel,
  constraints: RecommendationConstraints,
): RecommendationItem {
  const asyncSignals = [...model.filePaths, ...model.packageFiles].some((value) =>
    /queue|worker|cron|job|background|clone/i.test(value),
  );
  const needsQueue = asyncSignals || constraints.expectedTraffic === "medium" || constraints.expectedTraffic === "high";

  const recommendedTechnology = needsQueue ? "BullMQ + Redis" : "pg-boss";
  const confidence = clampScore(
    recommendedTechnology === "BullMQ + Redis"
      ? 79 + (asyncSignals ? 8 : 0) + (constraints.expectedTraffic === "high" ? 5 : 0)
      : 74 + (constraints.budget === "low" ? 4 : 0),
  );

  return {
    category: "Queue",
    title: "Queue",
    recommendedTechnology,
    confidence,
    reasoning:
      recommendedTechnology === "BullMQ + Redis"
        ? [
            "The repository needs a simple, proven pattern for asynchronous work and retries.",
            "BullMQ is a natural fit for a Node-based stack that already may use Redis for shared jobs.",
          ]
        : [
            "If queue usage is light, a PostgreSQL-backed job queue keeps the stack compact.",
            "It avoids introducing Redis too early when workload is still small.",
          ],
    repositoryEvidence: unique([
      ...model.filePaths.filter((path) => /queue|worker|cron|job|background|clone/i.test(path)),
      ...model.packageFiles,
    ]),
    tradeoffs:
      recommendedTechnology === "BullMQ + Redis"
        ? [
            "Excellent retry and delayed-job support.",
            "Requires Redis, which adds another service to operate.",
          ]
        : [
            "Single-database simplicity.",
            "Less ideal if the app eventually needs large-volume background processing.",
          ],
    alternatives:
      recommendedTechnology === "BullMQ + Redis"
        ? ["pg-boss", "Cloud Tasks", "Vercel Queues"]
        : ["BullMQ + Redis", "Vercel Queues", "Cloud Tasks"],
  };
}

function unique(values: string[]) {
  return values.filter((value, index) => values.indexOf(value) === index);
}
