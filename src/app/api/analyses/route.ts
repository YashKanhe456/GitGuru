import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { analyzeGitHubRepository } from "@/modules/repository/application/analyze-github-repository";
import { RepositoryInspectionError } from "@/modules/repository/infrastructure/github-repository-inspector";
import { saveAnalysis } from "@/modules/repository/infrastructure/analysis-store";
import { env } from "@/core/env";
import {
  ANALYSIS_RATE_LIMIT,
  consumeAnalysisRateLimit,
  getClientIp,
} from "@/modules/rate-limit/application/rate-limiter";

export const runtime = "nodejs";

const constraintsSchema = z.object({
  teamSize: z.number().int().min(1).max(1_000).optional(),
  budget: z.enum(["low", "medium", "high"]).optional(),
  expectedTraffic: z.enum(["low", "medium", "high"]).optional(),
  deploymentPreference: z.enum(["serverless", "traditional", "managed", "self-hosted"]).optional(),
  cloudProvider: z.string().trim().max(80).optional(),
  relationalPreference: z.enum(["relational", "nosql", "either"]).optional(),
  experienceLevel: z.enum(["beginner", "intermediate", "advanced"]).optional(),
}).strict();

const requestSchema = z.object({
  repoUrl: z.string().url().max(500),
  constraints: constraintsSchema.optional(),
}).strict();

export async function POST(request: NextRequest) {
  try {
    const rateLimit = await consumeAnalysisRateLimit(getClientIp(request.headers), {
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    });

    if (!rateLimit.allowed) {
      const retryAfterSeconds = Math.max(1, Math.ceil((rateLimit.resetAt - Date.now()) / 1_000));
      return NextResponse.json(
        {
          error: {
            code: "RATE_LIMIT_EXCEEDED",
            message: `Analysis is limited to ${ANALYSIS_RATE_LIMIT} requests per minute. Please try again shortly.`,
          },
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfterSeconds),
            "X-RateLimit-Limit": String(rateLimit.limit),
            "X-RateLimit-Remaining": String(rateLimit.remaining),
          },
        },
      );
    }

    const input = requestSchema.parse(await request.json());
    const analysis = await analyzeGitHubRepository(input);
    const storedAnalysis = await saveAnalysis({ ...analysis, constraints: input.constraints });

    return NextResponse.json({
      analysisId: storedAnalysis.id,
      createdAt: storedAnalysis.createdAt,
      ...analysis,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof RepositoryInspectionError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid analysis request.", details: error.flatten() }, { status: 400 });
    }

    console.error("Analysis request failed", error);
    return NextResponse.json({ error: "Could not analyze this repository. Verify DATABASE_URL and try again." }, { status: 500 });
  }
}
