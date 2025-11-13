/**
 * Rate Limiter Middleware
 * Simple in-memory token-bucket rate limiter (per-IP)
 */

const RATE_LIMIT_MAX = 5; // tokens per second
const RATE_LIMIT_CAPACITY = 5; // burst capacity
const rateBuckets = new Map();

/**
 * Rate limiter middleware using token bucket algorithm
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export function rateLimiter(req, res, next) {
  try {
    const ip =
      req.ip ||
      req.headers["x-forwarded-for"] ||
      req.socket.remoteAddress ||
      "unknown";
    const now = Date.now();
    const entry = rateBuckets.get(ip) || {
      tokens: RATE_LIMIT_CAPACITY,
      last: now,
    };
    const elapsed = Math.max(0, now - entry.last);
    const refill = (elapsed / 1000) * RATE_LIMIT_MAX;
    entry.tokens = Math.min(RATE_LIMIT_CAPACITY, entry.tokens + refill);
    entry.last = now;
    if (entry.tokens >= 1) {
      entry.tokens -= 1;
      rateBuckets.set(ip, entry);
      next();
    } else {
      res.status(429).json({ error: "Too many requests" });
    }
  } catch (e) {
    next();
  }
}

/**
 * Clear all rate limit buckets (for testing or manual reset)
 */
export function clearRateLimits() {
  rateBuckets.clear();
}

/**
 * Get rate limiter statistics
 * @returns {Object} Rate limiter statistics
 */
export function getRateLimiterStats() {
  return {
    activeIPs: rateBuckets.size,
    maxTokensPerSecond: RATE_LIMIT_MAX,
    burstCapacity: RATE_LIMIT_CAPACITY,
  };
}

export default rateLimiter;
