import type { RecommendationConstraints, RecommendationItem } from "../domain/types";
import type { NormalizedKnowledgeModel } from "../infrastructure/normalize-knowledge-model";
import { clampScore } from "./utils";

export function recommendMonitoring(
  model: NormalizedKnowledgeModel,
  constraints: RecommendationConstraints,
): RecommendationItem {
  const hasMonitoringSignals = [...model.filePaths, ...model.packageFiles].some((value) =>
    /monitor|observability|sentry|otel|telemetry/i.test(value),
  );

  const recommendedTechnology =
    constraints.deploymentPreference === "serverless" ? "Vercel Observability" : "Sentry + OpenTelemetry";
  const confidence = clampScore(81 + (hasMonitoringSignals ? 6 : 0) + (constraints.expectedTraffic !== "low" ? 4 : 0));

  return {
    category: "Monitoring",
    title: "Monitoring",
    recommendedTechnology,
    confidence,
    reasoning:
      recommendedTechnology === "Vercel Observability"
        ? [
            "If the app is headed to Vercel, its observability stack is the simplest deployment-aligned choice.",
            "It keeps the first monitoring setup lightweight and integrated with the platform.",
          ]
        : [
            "Sentry catches runtime errors quickly and OpenTelemetry adds cross-service tracing.",
            "This is the safest monitoring baseline for a growing product with multiple modules.",
          ],
    repositoryEvidence: unique([
      ...model.filePaths.filter((path) => /monitor|observability|sentry|otel|telemetry/i.test(path)),
      ...model.packageFiles,
    ]),
    tradeoffs:
      recommendedTechnology === "Vercel Observability"
        ? [
            "Very convenient on Vercel.",
            "Less portable than a vendor-neutral observability stack.",
          ]
        : [
            "More portable and works well across deployment targets.",
            "Requires a bit more setup than platform-only monitoring.",
          ],
    alternatives:
      recommendedTechnology === "Vercel Observability"
        ? ["Sentry + OpenTelemetry", "Datadog", "Grafana Cloud"]
        : ["Vercel Observability", "Datadog", "Grafana Cloud"],
  };
}

function unique(values: string[]) {
  return values.filter((value, index) => values.indexOf(value) === index);
}
