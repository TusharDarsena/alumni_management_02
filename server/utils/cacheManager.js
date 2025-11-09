/**
 * Cache Manager
 * Handles both Redis and in-memory caching with automatic fallback
 */

// Redis / in-memory cache helpers for suggestions
const inMemoryCache = new Map(); // key -> { value, expiresAt }
const CACHE_TTL = 60; // seconds
let redisClient = null;
let redisInitializing = false;

/**
 * Ensure Redis connection is established (lazy initialization)
 * @returns {Promise<Object|null>} Redis client or null if unavailable
 */
async function ensureRedis() {
  if (redisClient) return redisClient;
  if (redisInitializing) return null;
  const url = process.env.REDIS_URL || process.env.REDIS_HOST || null;
  if (!url) return null;
  redisInitializing = true;
  try {
    const redisModule = await import("redis");
    const createClient =
      redisModule.createClient || redisModule.default?.createClient;
    if (!createClient) {
      console.warn("Redis client factory not found");
      redisInitializing = false;
      return null;
    }
    redisClient = createClient({ url });
    redisClient.on &&
      redisClient.on("error", (e) => console.warn("Redis error", e));
    await redisClient.connect();
    redisInitializing = false;
    return redisClient;
  } catch (e) {
    console.warn("Redis not available, continuing without it:", e.message || e);
    redisInitializing = false;
    return null;
  }
}

/**
 * Get cached value by key
 * @param {string} cacheKey - The cache key
 * @returns {Promise<any|null>} Cached value or null if not found
 */
export async function getCached(cacheKey) {
  try {
    const r = await ensureRedis();
    if (r) {
      const cached = await r.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } else {
      const cached = inMemoryCache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        return cached.value;
      }
    }
  } catch (cacheErr) {
    console.warn("Cache read failed", cacheErr?.message || cacheErr);
  }
  return null;
}

/**
 * Set cached value with TTL
 * @param {string} cacheKey - The cache key
 * @param {any} value - The value to cache
 * @param {number} ttl - Time to live in seconds (defaults to CACHE_TTL)
 * @returns {Promise<void>}
 */
export async function setCached(cacheKey, value, ttl = CACHE_TTL) {
  try {
    const payload = JSON.stringify(value);
    const r = await ensureRedis();
    if (r) {
      await r.set(cacheKey, payload, { EX: ttl });
    } else {
      inMemoryCache.set(cacheKey, {
        value,
        expiresAt: Date.now() + ttl * 1000,
      });
    }
  } catch (cacheErr) {
    console.warn("Cache write failed", cacheErr?.message || cacheErr);
  }
}

/**
 * Clear all in-memory cache (for testing or manual cache invalidation)
 */
export function clearInMemoryCache() {
  inMemoryCache.clear();
}

/**
 * Get cache statistics
 * @returns {Object} Cache statistics
 */
export function getCacheStats() {
  return {
    inMemoryCacheSize: inMemoryCache.size,
    redisConnected: redisClient !== null,
    cacheTTL: CACHE_TTL,
  };
}

export { CACHE_TTL };
