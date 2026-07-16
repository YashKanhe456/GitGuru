import "server-only";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().optional(),
  GITHUB_TOKEN: z.string().optional(),
  GIT_CLONE_TIMEOUT_MS: z.coerce.number().int().positive().default(60_000),
  CLONE_WORKDIR: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
}).refine(
  (value) => Boolean(value.UPSTASH_REDIS_REST_URL) === Boolean(value.UPSTASH_REDIS_REST_TOKEN),
  "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set together.",
);

export const env = envSchema.parse(process.env);
