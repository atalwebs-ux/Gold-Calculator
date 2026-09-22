import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

interface ClientRecord {
  timestamps: number[];
}

interface RateLimiterOptions {
  windowMs: number;
  maxRequests: number;
}

/**
 * Lightweight in-memory sliding window rate limiter.
 * Protects public endpoints against DDoS, brute force, and runaway pollers without third-party bloat.
 */
export function createRateLimiter(options: RateLimiterOptions) {
  const { windowMs, maxRequests } = options;
  const clientMap = new Map<string, ClientRecord>();

  // Prune expired client records every 5 minutes to prevent memory leaks
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of clientMap.entries()) {
      record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);
      if (record.timestamps.length === 0) {
        clientMap.delete(ip);
      }
    }
  }, 5 * 60 * 1000);

  // Unref interval so it does not block Node process exit in tests
  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }

  return function rateLimiter(req: Request, res: Response, next: NextFunction) {
    // Whitelist health checks and public static pages from rate limiting
    if (req.path === '/health' || req.path === '/privacy-policy' || req.path === '/delete-account') {
      return next();
    }

    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      'unknown';

    const now = Date.now();
    let record = clientMap.get(ip);

    if (!record) {
      record = { timestamps: [] };
      clientMap.set(ip, record);
    }

    // Filter timestamps within current sliding window
    record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

    const remaining = Math.max(0, maxRequests - record.timestamps.length);

    res.setHeader('X-RateLimit-Limit', maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', remaining.toString());

    if (record.timestamps.length >= maxRequests) {
      const oldestTimestamp = record.timestamps[0];
      const retryAfterSeconds = Math.ceil((oldestTimestamp + windowMs - now) / 1000);
      res.setHeader('Retry-After', Math.max(1, retryAfterSeconds).toString());
      return sendError(
        res,
        'Too many requests. Please slow down and try again shortly.',
        429,
        'RATE_LIMIT_EXCEEDED'
      );
    }

    record.timestamps.push(now);
    next();
  };
}

export const standardRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 120,    // 120 requests per minute
});
