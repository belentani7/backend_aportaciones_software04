import { describe, expect, it } from "vitest";
import { createBoundedRateLimiter } from "./rateLimiter";

describe("bounded rate limiter", () => {
  it("limits a key and reports a positive retry delay", () => {
    const limiter = createBoundedRateLimiter({ maxKeys: 2, windowMs: 1_000, maxRequests: 2 });
    expect(limiter.check("a", 0)).toEqual({ allowed: true, remaining: 1 });
    expect(limiter.check("a", 10)).toEqual({ allowed: true, remaining: 0 });
    expect(limiter.check("a", 20)).toEqual({ allowed: false, retryAfterMs: 980 });
    expect(limiter.check("a", 1_001)).toEqual({ allowed: true, remaining: 1 });
  });

  it("keeps memory bounded by evicting oldest keys", () => {
    const limiter = createBoundedRateLimiter({ maxKeys: 2, windowMs: 10_000, maxRequests: 1 });
    limiter.check("a", 0);
    limiter.check("b", 1);
    limiter.check("c", 2);
    expect(limiter.size()).toBe(2);
    expect(limiter.check("a", 3)).toEqual({ allowed: true, remaining: 0 });
  });
});
