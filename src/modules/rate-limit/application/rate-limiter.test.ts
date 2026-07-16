import { describe, expect, it } from "vitest";
import { createInMemoryRateLimiter } from "./rate-limiter";

describe("createInMemoryRateLimiter", () => {
  it("rejects requests beyond the configured limit", () => {
    const limiter = createInMemoryRateLimiter({ limit: 2, windowMs: 60_000, now: () => 1_000 });

    expect(limiter.consume("203.0.113.10")).toMatchObject({ allowed: true, remaining: 1 });
    expect(limiter.consume("203.0.113.10")).toMatchObject({ allowed: true, remaining: 0 });
    expect(limiter.consume("203.0.113.10")).toMatchObject({ allowed: false, remaining: 0 });
  });
});
