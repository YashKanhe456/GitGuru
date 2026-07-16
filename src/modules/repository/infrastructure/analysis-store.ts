import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/client";
import type { AnalyzeGitHubRepositoryInput } from "../application/analyze-github-repository";
import type { RepositoryKnowledgeModel } from "../domain/knowledge-model";
import type { RecommendationItem } from "../../recommendation/domain/types";

type SaveAnalysisInput = {
  repository: {
    url: string;
    owner: string;
    name: string;
    defaultBranch: string;
  };
  constraints: AnalyzeGitHubRepositoryInput["constraints"];
  knowledgeModel: RepositoryKnowledgeModel;
  recommendations: RecommendationItem[];
  truncated: boolean;
};

export async function saveAnalysis(input: SaveAnalysisInput) {
  const repository = await prisma.repository.upsert({
    where: { url: input.repository.url },
    update: {
      owner: input.repository.owner,
      name: input.repository.name,
      defaultBranch: input.repository.defaultBranch,
    },
    create: {
      url: input.repository.url,
      owner: input.repository.owner,
      name: input.repository.name,
      defaultBranch: input.repository.defaultBranch,
    },
  });

  return prisma.analysis.create({
    data: {
      repositoryId: repository.id,
      defaultBranch: input.repository.defaultBranch,
      constraints: toJson(input.constraints ?? {}),
      knowledgeModel: toJson(input.knowledgeModel),
      recommendations: toJson(input.recommendations),
      truncated: input.truncated,
    },
    select: { id: true, createdAt: true },
  });
}

function toJson(value: unknown) {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}
