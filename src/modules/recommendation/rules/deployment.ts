import type { RecommendationConstraints, RecommendationItem } from "../domain/types";
import type { NormalizedKnowledgeModel } from "../infrastructure/normalize-knowledge-model";
import { clampScore } from "./utils";

export function recommendDeployment(
  model: NormalizedKnowledgeModel,
  constraints: RecommendationConstraints,
): RecommendationItem {
  const hasVercelSignals = model.frameworks.some((framework) => /next/i.test(framework));
  const needsWorkers = [...model.filePaths, ...model.packageFiles, ...model.frameworks].some((value) =>
    /queue|worker|cron|job|background|clone/i.test(value),
  );
  const cloudProvider = constraints.cloudProvider?.toLowerCase();

  const recommendedTechnology = pickDeploymentPlatform({
    cloudProvider,
    deploymentPreference: constraints.deploymentPreference,
    hasVercelSignals,
    needsWorkers,
  });

  const confidence = clampScore(
    recommendedTechnology === "Vercel"
      ? 84 + (hasVercelSignals ? 10 : 0) + (constraints.deploymentPreference === "serverless" ? 4 : 0)
      : recommendedTechnology === "Render"
        ? 82 + (needsWorkers ? 8 : 0)
        : 78 + (cloudProvider ? 8 : 0),
  );

  return {
    category: "Deployment Platform",
    title: "Deployment Platform",
    recommendedTechnology,
    confidence,
    reasoning:
      recommendedTechnology === "Vercel"
        ? [
            "The repository appears to be a Next.js app, which makes Vercel the most natural deployment target.",
            "It keeps the deployment path simple for a small team and a fast portfolio build.",
          ]
        : recommendedTechnology === "Render"
          ? [
              "The repository needs a friendly home for app services plus background workers.",
              "Render keeps the platform simple while still supporting long-running processes.",
            ]
          : [
              `The user's cloud preference points to ${constraints.cloudProvider}.`,
              "Matching the requested cloud reduces platform friction and keeps the architecture aligned.",
            ],
    repositoryEvidence: unique([
      ...model.frameworks,
      ...model.filePaths.filter((path) => /next\.config|app\/|vercel|docker|worker|queue/i.test(path)),
      ...model.packageFiles,
    ]),
    tradeoffs:
      recommendedTechnology === "Vercel"
        ? [
            "Excellent for Next.js frontend and serverless-style routes.",
            "Background workers and long-lived tasks may need a separate service later.",
          ]
        : recommendedTechnology === "Render"
          ? [
              "Simple unified platform for web services and workers.",
              "Less optimized for edge/serverless patterns than Vercel.",
            ]
          : [
              "Strong alignment with the requested cloud provider.",
              "May require more infrastructure setup than a managed app platform.",
            ],
    alternatives:
      recommendedTechnology === "Vercel"
        ? ["Render", "Fly.io", "Cloud Run"]
        : recommendedTechnology === "Render"
          ? ["Vercel", "Fly.io", "Cloud Run"]
          : ["Vercel", "Render", "Fly.io"],
  };
}

function pickDeploymentPlatform({
  cloudProvider,
  deploymentPreference,
  hasVercelSignals,
  needsWorkers,
}: {
  cloudProvider?: string;
  deploymentPreference?: RecommendationConstraints["deploymentPreference"];
  hasVercelSignals: boolean;
  needsWorkers: boolean;
}) {
  if (cloudProvider) {
    if (cloudProvider.includes("google")) return "Cloud Run";
    if (cloudProvider.includes("aws")) return "AWS ECS";
    if (cloudProvider.includes("azure")) return "Azure App Service";
    if (cloudProvider.includes("vercel")) return "Vercel";
    if (cloudProvider.includes("render")) return "Render";
  }

  if (deploymentPreference === "serverless" && hasVercelSignals) {
    return "Vercel";
  }

  if (needsWorkers || deploymentPreference === "traditional") {
    return "Render";
  }

  return "Vercel";
}

function unique(values: string[]) {
  return values.filter((value, index) => values.indexOf(value) === index);
}
