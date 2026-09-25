import { Request, Response, NextFunction } from 'express';
interface RateLimiterOptions {
    windowMs: number;
    maxRequests: number;
}
/**
 * Lightweight in-memory sliding window rate limiter.
 * Protects public endpoints against DDoS, brute force, and runaway pollers without third-party bloat.
 */
export declare function createRateLimiter(options: RateLimiterOptions): (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
export declare const standardRateLimiter: (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
export {};
