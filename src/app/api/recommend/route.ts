import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { recommendEngineering } from "@/modules/recommendation/application/recommend-engine";
import type { RepositoryKnowledgeModel } from "@/modules/repository/domain/knowledge-model";

const constraintsSchema = z.object({
  teamSize: z.number().int().positive().optional(),
  budget: z.enum(["low", "medium", "high"]).optional(),
  expectedTraffic: z.enum(["low", "medium", "high"]).optional(),
  deploymentPreference: z.enum(["serverless", "traditional", "managed", "self-hosted"]).optional(),
  cloudProvider: z.string().optional(),
  relationalPreference: z.enum(["relational", "nosql", "either"]).optional(),
  experienceLevel: z.enum(["beginner", "intermediate", "advanced"]).optional(),
});

const requestSchema = z.object({
  repositoryKnowledgeModel: z.record(z.string(), z.unknown()),
  constraints: constraintsSchema.optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = requestSchema.parse(await request.json());
    const result = recommendEngineering({
      ...body,
      repositoryKnowledgeModel: body.repositoryKnowledgeModel as RepositoryKnowledgeModel,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not generate recommendations.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
