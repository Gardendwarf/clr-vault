import { LRUCache } from 'lru-cache';
import { createChildLogger } from '../utils/logger.js';

const logger = createChildLogger('cache');

// Generic string-keyed cache for API responses
const responseCache = new LRUCache<string, unknown>({
  max: 1000,
  ttl: 1000 * 60 * 5, // 5 minutes
});

// Rate limit tracking per API key
const rateLimitCache = new LRUCache<string, { count: number; resetAt: number }>({
  max: 10000,
  ttl: 1000 * 60, // 1 minute window
});

export const cacheService = {
  // Response cache
  get<T>(key: string): T | undefined {
    return responseCache.get(key) as T | undefined;
  },

  set(key: string, value: unknown, ttlMs?: number): void {
    responseCache.set(key, value, { ttl: ttlMs });
  },

  invalidate(key: string): void {
    responseCache.delete(key);
  },

  invalidatePattern(pattern: string): void {
    for (const key of responseCache.keys()) {
      if (key.startsWith(pattern)) {
        responseCache.delete(key);
      }
    }
  },

  clear(): void {
    responseCache.clear();
    logger.info('Response cache cleared');
  },

  // Rate limiting
  checkRateLimit(apiKeyId: string, limit: number): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute window
    const entry = rateLimitCache.get(apiKeyId);

    if (!entry || entry.resetAt < now) {
      // New window
      const resetAt = now + windowMs;
      rateLimitCache.set(apiKeyId, { count: 1, resetAt });
      return { allowed: true, remaining: limit - 1, resetAt };
    }

    entry.count++;
    rateLimitCache.set(apiKeyId, entry);

    if (entry.count > limit) {
      return { allowed: false, remaining: 0, resetAt: entry.resetAt };
    }

    return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt };
  },

  getCacheStats() {
    return {
      responseCache: {
        size: responseCache.size,
        calculatedSize: responseCache.calculatedSize,
      },
      rateLimitCache: {
        size: rateLimitCache.size,
      },
    };
  },
};
