import crypto from "crypto";

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class CacheManager {
  private cache = new Map<string, CacheEntry<any>>();
  private stats = { hits: 0, misses: 0, sets: 0, deletes: 0 };

  set<T>(key: string, value: T, ttlMs: number = 300000): void {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
    this.stats.sets++;
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      this.stats.misses++;
      return null;
    }
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }
    this.stats.hits++;
    return entry.value as T;
  }

  delete(key: string): void {
    this.cache.delete(key);
    this.stats.deletes++;
  }

  clear(): void {
    this.cache.clear();
  }

  prune(): number {
    const now = Date.now();
    let pruned = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        pruned++;
      }
    }
    return pruned;
  }

  getStats() {
    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0,
    };
  }

  reset(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0, sets: 0, deletes: 0 };
  }

  keys(): string[] {
    return Array.from(this.cache.keys());
  }
}

export const cacheManager = new CacheManager();

export function getCacheKey(...parts: string[]): string {
  return parts.join(":");
}

export async function withCache<T>(
  key: string,
  fn: () => Promise<T>,
  ttlMs?: number
): Promise<T> {
  const cached = cacheManager.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  const result = await fn();
  cacheManager.set(key, result, ttlMs);
  return result;
}

export function invalidatePattern(pattern: string): number {
  let invalidated = 0;
  const regex = new RegExp(pattern);

  for (const key of cacheManager.keys()) {
    if (regex.test(key)) {
      cacheManager.delete(key);
      invalidated++;
    }
  }

  return invalidated;
}
