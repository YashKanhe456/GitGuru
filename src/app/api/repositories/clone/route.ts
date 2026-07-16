import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ingestRepository } from "@/modules/repository/application/ingest-repository";

const requestSchema = z.object({
  repoUrl: z.string().url(),
  destinationRoot: z.string().optional(),
  timeoutMs: z.number().int().positive().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = requestSchema.parse(await request.json());
    const result = await ingestRepository(body);

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Repository clone failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
