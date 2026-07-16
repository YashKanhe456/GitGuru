export type BudgetLevel = "low" | "medium" | "high";
export type TrafficLevel = "low" | "medium" | "high";
export type DeploymentPreference = "serverless" | "traditional" | "managed" | "self-hosted";
export type RelationalPreference = "relational" | "nosql" | "either";
export type ExperienceLevel = "beginner" | "intermediate" | "advanced";

export type RecommendationConstraints = {
  teamSize?: number;
  budget?: BudgetLevel;
  expectedTraffic?: TrafficLevel;
  deploymentPreference?: DeploymentPreference;
  cloudProvider?: string;
  relationalPreference?: RelationalPreference;
  experienceLevel?: ExperienceLevel;
};

export type RecommendationCategory =
  | "Database"
  | "ORM"
  | "Authentication"
  | "Deployment Platform"
  | "Caching"
  | "Queue"
  | "Logging"
  | "Monitoring";

export type RecommendationItem = {
  category: RecommendationCategory;
  title: string;
  recommendedTechnology: string;
  confidence: number;
  reasoning: string[];
  repositoryEvidence: string[];
  tradeoffs: string[];
  alternatives: string[];
};

export type RecommendationResponse = {
  recommendations: RecommendationItem[];
};
