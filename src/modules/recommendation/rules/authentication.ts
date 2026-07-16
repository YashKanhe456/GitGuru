import type { RecommendationConstraints, RecommendationItem } from "../domain/types";
import type { NormalizedKnowledgeModel } from "../infrastructure/normalize-knowledge-model";
import { clampScore } from "./utils";

export function recommendAuthentication(
  model: NormalizedKnowledgeModel,
  constraints: RecommendationConstraints,
): RecommendationItem {
  const hasNextSignals = [...model.frameworks, ...model.filePaths].some((value) => /next|app\/|pages\//i.test(value));
  const smallTeam = (constraints.teamSize ?? 0) > 0 && (constraints.teamSize ?? 0) <= 5;
  const lowBudget = constraints.budget === "low";

  const recommendedTechnology = hasNextSignals && (smallTeam || lowBudget) ? "Auth.js" : "Clerk";
  const confidence = clampScore(
    recommendedTechnology === "Auth.js"
      ? 82 + (hasNextSignals ? 8 : 0) + (lowBudget ? 4 : 0)
      : 76 + (constraints.experienceLevel === "beginner" ? 4 : 0),
  );

  return {
    category: "Authentication",
    title: "Authentication",
    recommendedTechnology,
    confidence,
    reasoning:
      recommendedTechnology === "Auth.js"
        ? [
            "The repository looks like a Next.js-style web application, so a framework-native auth stack is the simplest path.",
            "Auth.js keeps control in the codebase and avoids adding a paid vendor too early.",
          ]
        : [
            "Clerk is the fastest path when the team wants a polished auth experience with less integration work.",
            "It is a good fit when speed matters more than owning every auth primitive.",
          ],
    repositoryEvidence: unique([
      ...model.frameworks,
      ...model.filePaths.filter((path) => /app\/|pages\/|auth|login|sign/i.test(path)),
      ...model.packageFiles,
    ]),
    tradeoffs:
      recommendedTechnology === "Auth.js"
        ? [
            "Very flexible and usually cost-effective.",
            "Requires more implementation ownership than a hosted auth vendor.",
          ]
        : [
            "Quick to ship with a polished developer experience.",
            "Adds a vendor dependency and may introduce recurring cost later.",
          ],
    alternatives: recommendedTechnology === "Auth.js" ? ["Clerk", "Supabase Auth"] : ["Auth.js", "Supabase Auth"],
  };
}

function unique(values: string[]) {
  return values.filter((value, index) => values.indexOf(value) === index);
}
