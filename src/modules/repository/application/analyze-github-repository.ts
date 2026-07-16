import { recommendEngineering, type RecommendEngineeringInput } from "../../recommendation/application/recommend-engine";
import { buildRepositoryKnowledgeModel } from "../domain/knowledge-model";
import { inspectGitHubRepository } from "../infrastructure/github-repository-inspector";

export type AnalyzeGitHubRepositoryInput = Pick<RecommendEngineeringInput, "constraints"> & {
  repoUrl: string;
};

export async function analyzeGitHubRepository(input: AnalyzeGitHubRepositoryInput) {
  const inspection = await inspectGitHubRepository(input.repoUrl);
  const knowledgeModel = buildRepositoryKnowledgeModel(inspection.knowledgeModelInput);
  const recommendation = recommendEngineering({
    repositoryKnowledgeModel: knowledgeModel,
    constraints: input.constraints,
  });

  return {
    repository: inspection.repository,
    truncated: inspection.truncated,
    knowledgeModel,
    recommendations: recommendation.recommendations,
  };
}
