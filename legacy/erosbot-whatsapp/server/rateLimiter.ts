export type RateLimitDecision = { allowed: true; remaining: number } | { allowed: false; retryAfterMs: number };

export function createBoundedRateLimiter(options: { maxKeys: number; windowMs: number; maxRequests: number }) {
  const windows = new Map<string, { startedAt: number; count: number }>();

  function evictExpired(now: number) {
    for (const [key, value] of Array.from(windows.entries())) if (now - value.startedAt >= options.windowMs) windows.delete(key);
  }

  return {
    check(key: string, now = Date.now()): RateLimitDecision {
      evictExpired(now);
      const current = windows.get(key);
      if (!current) {
        if (windows.size >= options.maxKeys) windows.delete(windows.keys().next().value as string);
        windows.set(key, { startedAt: now, count: 1 });
        return { allowed: true, remaining: options.maxRequests - 1 };
      }
      if (current.count >= options.maxRequests) return { allowed: false, retryAfterMs: Math.max(1, options.windowMs - (now - current.startedAt)) };
      current.count += 1;
      return { allowed: true, remaining: options.maxRequests - current.count };
    },
    size: () => windows.size,
  };
}
