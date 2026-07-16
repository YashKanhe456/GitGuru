export const ANALYSIS_RATE_LIMIT = 6;
export const ANALYSIS_RATE_LIMIT_WINDOW_SECONDS = 60;

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
};

type RateLimitConfiguration = {
  url?: string;
  token?: string;
};

type InMemoryBucket = { count: number; resetAt: number };

export function createInMemoryRateLimiter(options: { limit: number; windowMs: number; now?: () => number }) {
  const buckets = new Map<string, InMemoryBucket>();
  const now = options.now ?? Date.now;

  return {
    consume(identifier: string): RateLimitResult {
      const currentTime = now();
      const existing = buckets.get(identifier);
      const bucket = !existing || existing.resetAt <= currentTime
        ? { count: 0, resetAt: currentTime + options.windowMs }
        : existing;

      bucket.count += 1;
      buckets.set(identifier, bucket);

      return {
        allowed: bucket.count <= options.limit,
        limit: options.limit,
        remaining: Math.max(0, options.limit - bucket.count),
        resetAt: bucket.resetAt,
      };
    },
  };
}

const inMemoryLimiter = createInMemoryRateLimiter({
  limit: ANALYSIS_RATE_LIMIT,
  windowMs: ANALYSIS_RATE_LIMIT_WINDOW_SECONDS * 1_000,
});

export async function consumeAnalysisRateLimit(identifier: string, configuration: RateLimitConfiguration): Promise<RateLimitResult> {
  if (configuration.url && configuration.token) {
    try {
      return await consumeUpstashRateLimit(identifier, configuration as Required<RateLimitConfiguration>);
    } catch (error) {
      console.error("Upstash rate limit unavailable; using in-memory fallback.", error);
    }
  }

  return inMemoryLimiter.consume(identifier);
}

export function getClientIp(headers: Headers) {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? headers.get("x-real-ip") ?? "unknown";
}

async function consumeUpstashRateLimit(identifier: string, configuration: Required<RateLimitConfiguration>) {
  const key = `vulcan:rate-limit:analyses:${identifier}`;
  const response = await fetch(`${configuration.url}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${configuration.token}`, "Content-Type": "application/json" },
    body: JSON.stringify([["INCR", key], ["EXPIRE", key, ANALYSIS_RATE_LIMIT_WINDOW_SECONDS, "NX"], ["TTL", key]]),
    cache: "no-store",
  });

  if (!response.ok) throw new Error(`Upstash returned ${response.status}.`);

  const results = await response.json() as Array<{ result?: number }>;
  const count = Number(results[0]?.result);
  const ttl = Number(results[2]?.result);
  if (!Number.isFinite(count)) throw new Error("Upstash returned an invalid rate-limit count.");

  return {
    allowed: count <= ANALYSIS_RATE_LIMIT,
    limit: ANALYSIS_RATE_LIMIT,
    remaining: Math.max(0, ANALYSIS_RATE_LIMIT - count),
    resetAt: Date.now() + Math.max(1, Number.isFinite(ttl) && ttl > 0 ? ttl : ANALYSIS_RATE_LIMIT_WINDOW_SECONDS) * 1_000,
  };
}
