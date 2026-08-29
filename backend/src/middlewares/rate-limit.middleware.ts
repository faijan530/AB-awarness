import { Request, Response, NextFunction } from 'express';
import { isRedisConnected, redisClient } from '../config/redis';
import { ApiResponse } from '../utils/api-response';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const memoryStore: RateLimitStore = {};

export interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
  keyPrefix?: string;
}

export function createRateLimiter(options: RateLimitOptions) {
  const { windowMs, max, message = 'Too many requests. Please try again later.', keyPrefix = 'rl' } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown-ip';
    const key = `${keyPrefix}:${clientIp}`;
    const now = Date.now();

    if (isRedisConnected && redisClient) {
      try {
        const current = await redisClient.incr(key);
        if (current === 1) {
          await redisClient.pexpire(key, windowMs);
        }
        if (current > max) {
          const ttl = await redisClient.pttl(key);
          res.setHeader('Retry-After', Math.ceil(ttl / 1000));
          return ApiResponse.error(res, message, 'TOO_MANY_REQUESTS', { retryAfterSeconds: Math.ceil(ttl / 1000) }, 429);
        }
        return next();
      } catch {
        // Fallback to memory store if Redis fails
      }
    }

    // Memory Store Fallback
    const record = memoryStore[key];
    if (!record || now > record.resetTime) {
      memoryStore[key] = {
        count: 1,
        resetTime: now + windowMs,
      };
      return next();
    }

    record.count += 1;
    if (record.count > max) {
      const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfterSeconds);
      return ApiResponse.error(res, message, 'TOO_MANY_REQUESTS', { retryAfterSeconds }, 429);
    }

    next();
  };
}

// Strict Rate Limiter for Authentication Endpoints (15 requests per 15 minutes)
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
  keyPrefix: 'auth_rl',
});

// Moderate Rate Limiter for Write Operations (30 requests per minute)
export const writeRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  message: 'Request rate limit exceeded. Please slow down.',
  keyPrefix: 'write_rl',
});
