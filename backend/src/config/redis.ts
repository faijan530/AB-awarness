import { Redis } from 'ioredis';
import { env } from './env.config';
import { logger } from './logger';

export let redisClient: Redis | null = null;
export let isRedisConnected = false;

export function initRedis(): void {
  try {
    redisClient = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) {
          logger.warn('⚠️ Redis reconnection attempts exhausted. Operating with graceful fallback.');
          return null; // Stop retrying
        }
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
    });

    redisClient.on('connect', () => {
      isRedisConnected = true;
      logger.info('✅ Redis connected successfully.');
    });

    redisClient.on('error', (err) => {
      isRedisConnected = false;
      logger.warn('⚠️ Redis Connection Error:', err.message);
    });

    redisClient.connect().catch((err) => {
      isRedisConnected = false;
      logger.warn('⚠️ Could not establish initial Redis connection. Graceful fallback active.');
    });
  } catch (error) {
    isRedisConnected = false;
    logger.warn('⚠️ Redis initialization failed. Caching operations will fall back to direct DB queries.');
  }
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient && isRedisConnected) {
    await redisClient.quit();
    logger.info('Redis connection closed cleanly.');
  }
}
