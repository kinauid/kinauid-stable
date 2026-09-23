/**
 * Lightweight, Production-Ready In-Memory Data Caching Layer
 * Provides high-performance in-memory caching with TTL, Stale-While-Revalidate (SWR),
 * Tag-based invalidation, LRU eviction, and telemetry stats.
 */

export interface CacheEntry<T = any> {
  value: T;
  expiresAt: number;
  swrExpiresAt?: number;
  tags?: string[];
  createdAt: number;
  accessedAt: number;
}

export interface CacheDataOptions {
  /**
   * Stale-while-revalidate window in seconds.
   * If specified, expired entries within this window return stale data immediately
   * while triggering an asynchronous background revalidation.
   */
  staleWhileRevalidateSeconds?: number;

  /**
   * Tags associated with this cache entry for group invalidation.
   */
  tags?: string[];

  /**
   * If true, forces fresh fetch and overwrites existing cache.
   */
  forceFresh?: boolean;
}

export interface CacheStats {
  size: number;
  maxSize: number;
  hits: number;
  misses: number;
  hitRatio: number;
  keys: string[];
}

const MAX_CACHE_ENTRIES = 1000;
const STORE = new Map<string, CacheEntry<any>>();
const IN_FLIGHT_PROMISES = new Map<string, Promise<any>>();

let stats = {
  hits: 0,
  misses: 0,
};

/**
 * Evicts least recently accessed entries if store size exceeds MAX_CACHE_ENTRIES.
 */
function evictOldestEntriesIfNeeded() {
  if (STORE.size <= MAX_CACHE_ENTRIES) return;

  // Find oldest accessed entry
  let oldestKey: string | null = null;
  let oldestTime = Infinity;

  for (const [key, entry] of STORE.entries()) {
    if (entry.accessedAt < oldestTime) {
      oldestTime = entry.accessedAt;
      oldestKey = key;
    }
  }

  if (oldestKey) {
    STORE.delete(oldestKey);
  }
}

/**
 * Caches asynchronous data fetchers in memory with configurable TTL, SWR, and group tagging.
 *
 * @example
 * export async function loader({ request }: LoaderFunctionArgs) {
 *   const data = await cacheData("admin:users:list", 60, async () => {
 *     return await fetchUsersFromDB();
 *   }, { tags: ["users"] });
 *   return { data };
 * }
 */
export async function cacheData<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>,
  options?: CacheDataOptions
): Promise<T> {
  const now = Date.now();
  const entry = STORE.get(key);

  // 1. Force fresh override
  if (options?.forceFresh) {
    return executeAndSet(key, ttlSeconds, fetcher, options);
  }

  // 2. Cache Hit (Fresh)
  if (entry && now < entry.expiresAt) {
    stats.hits++;
    entry.accessedAt = now;
    return entry.value as T;
  }

  // 3. Stale-While-Revalidate (SWR) Hit
  if (entry && entry.swrExpiresAt && now < entry.swrExpiresAt && !IN_FLIGHT_PROMISES.has(key)) {
    stats.hits++;
    entry.accessedAt = now;

    // Trigger non-blocking background refresh
    const bgPromise = executeAndSet(key, ttlSeconds, fetcher, options).catch((err) => {
      console.error(`[Cache SWR Refresh Failed] key="${key}":`, err);
    });
    IN_FLIGHT_PROMISES.set(key, bgPromise);

    return entry.value as T;
  }

  // 4. Cache Miss - Prevent Thundering Herd (deduplicate simultaneous requests)
  stats.misses++;
  const existingInFlight = IN_FLIGHT_PROMISES.get(key);
  if (existingInFlight) {
    return existingInFlight as Promise<T>;
  }

  const promise = executeAndSet(key, ttlSeconds, fetcher, options);
  IN_FLIGHT_PROMISES.set(key, promise);

  try {
    return await promise;
  } finally {
    IN_FLIGHT_PROMISES.delete(key);
  }
}

async function executeAndSet<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>,
  options?: CacheDataOptions
): Promise<T> {
  const value = await fetcher();
  const now = Date.now();
  const ttlMs = Math.max(1, ttlSeconds) * 1000;
  const swrMs = (options?.staleWhileRevalidateSeconds ?? 0) * 1000;

  evictOldestEntriesIfNeeded();

  STORE.set(key, {
    value,
    expiresAt: now + ttlMs,
    swrExpiresAt: swrMs > 0 ? now + ttlMs + swrMs : undefined,
    tags: options?.tags,
    createdAt: now,
    accessedAt: now,
  });

  return value;
}

/**
 * Invalidates cache by exact key or regex pattern.
 *
 * @example
 * invalidateCache("admin:users:list");
 * invalidateCache(/^admin:users:/);
 */
export function invalidateCache(keyOrPattern: string | RegExp): number {
  let count = 0;

  if (typeof keyOrPattern === 'string') {
    if (STORE.delete(keyOrPattern)) {
      count++;
    }
  } else {
    for (const key of STORE.keys()) {
      if (keyOrPattern.test(key)) {
        if (STORE.delete(key)) {
          count++;
        }
      }
    }
  }

  return count;
}

/**
 * Invalidates all cache entries tagged with a specific tag.
 *
 * @example
 * invalidateCacheByTag("users");
 */
export function invalidateCacheByTag(tag: string): number {
  let count = 0;

  for (const [key, entry] of STORE.entries()) {
    if (entry.tags && entry.tags.includes(tag)) {
      if (STORE.delete(key)) {
        count++;
      }
    }
  }

  return count;
}

/**
 * Clears all in-memory cached entries.
 */
export function clearCache(): void {
  STORE.clear();
  IN_FLIGHT_PROMISES.clear();
  stats.hits = 0;
  stats.misses = 0;
}

/**
 * Returns diagnostic statistics of the in-memory cache layer.
 */
export function getCacheStats(): CacheStats {
  const total = stats.hits + stats.misses;
  return {
    size: STORE.size,
    maxSize: MAX_CACHE_ENTRIES,
    hits: stats.hits,
    misses: stats.misses,
    hitRatio: total > 0 ? Math.round((stats.hits / total) * 100) / 100 : 0,
    keys: Array.from(STORE.keys()),
  };
}

/**
 * Wraps a data loader function with automatic in-memory caching.
 */
export function createCachedFetcher<TArgs extends any[], TReturn>(
  keyGenerator: (...args: TArgs) => string,
  ttlSeconds: number,
  fetcher: (...args: TArgs) => Promise<TReturn>,
  options?: CacheDataOptions
) {
  return async (...args: TArgs): Promise<TReturn> => {
    const key = keyGenerator(...args);
    return cacheData<TReturn>(key, ttlSeconds, () => fetcher(...args), options);
  };
}
