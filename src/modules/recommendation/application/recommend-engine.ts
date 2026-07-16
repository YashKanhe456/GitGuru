import type {
  RecommendationConstraints,
  RecommendationItem,
  RecommendationResponse,
} from "../domain/types";
import type { RepositoryKnowledgeModel } from "../../repository/domain/knowledge-model";
import { normalizeKnowledgeModel } from "../infrastructure/normalize-knowledge-model";
import { recommendAuthentication } from "../rules/authentication";
import { recommendCaching } from "../rules/caching";
import { recommendDatabase } from "../rules/database";
import { recommendDeployment } from "../rules/deployment";
import { recommendLogging } from "../rules/logging";
import { recommendMonitoring } from "../rules/monitoring";
import { recommendOrm } from "../rules/orm";
import { recommendQueue } from "../rules/queue";

export type RecommendEngineeringInput = {
  repositoryKnowledgeModel: RepositoryKnowledgeModel;
  constraints?: RecommendationConstraints;
};

export function recommendEngineering(input: RecommendEngineeringInput): RecommendationResponse {
  const model = normalizeKnowledgeModel(input.repositoryKnowledgeModel);
  const constraints = input.constraints ?? {};

  const recommendations: RecommendationItem[] = [
    recommendDatabase(model, constraints),
    recommendOrm(model, constraints),
    recommendAuthentication(model, constraints),
    recommendDeployment(model, constraints),
    recommendCaching(model, constraints),
    recommendQueue(model, constraints),
    recommendLogging(model, constraints),
    recommendMonitoring(model, constraints),
  ];

  return { recommendations };
}
