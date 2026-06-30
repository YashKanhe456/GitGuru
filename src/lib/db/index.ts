import { neon } from "@neondatabase/serverless";
import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import type { AnalysisReport, RepoSnapshot } from "@/lib/analysis/types";
import { analyses } from "@/lib/db/schema";

type Database = ReturnType<typeof drizzle>;

let database: Database | null = null;

export function getDb() {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  if (!database) {
    database = drizzle(neon(process.env.DATABASE_URL));
  }

  return database;
}

export async function saveAnalysis(snapshot: RepoSnapshot, report: AnalysisReport) {
  const db = getDb();

  if (!db) {
    return { id: crypto.randomUUID(), savedToDatabase: false };
  }

  const [saved] = await db
    .insert(analyses)
    .values({
      repoUrl: snapshot.url,
      repoName: `${snapshot.owner}/${snapshot.repo}`,
      techStack: snapshot.techStack,
      report,
    })
    .returning({ id: analyses.id });

  return { id: saved.id, savedToDatabase: true };
}

export async function listRecentAnalyses(limit = 6) {
  const db = getDb();

  if (!db) {
    return { configured: false, analyses: [] };
  }

  const rows = await db
    .select({
      id: analyses.id,
      repoUrl: analyses.repoUrl,
      repoName: analyses.repoName,
      status: analyses.status,
      techStack: analyses.techStack,
      createdAt: analyses.createdAt,
    })
    .from(analyses)
    .orderBy(desc(analyses.createdAt))
    .limit(limit);

  return { configured: true, analyses: rows };
}

export async function getAnalysisById(id: string) {
  const db = getDb();

  if (!db) {
    return null;
  }

  const [row] = await db
    .select({
      id: analyses.id,
      repoUrl: analyses.repoUrl,
      repoName: analyses.repoName,
      techStack: analyses.techStack,
      report: analyses.report,
      createdAt: analyses.createdAt,
    })
    .from(analyses)
    .where(eq(analyses.id, id))
    .limit(1);

  return row ?? null;
}
