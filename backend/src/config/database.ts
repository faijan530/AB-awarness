import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

const basePrisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'stdout', level: 'error' },
    { emit: 'stdout', level: 'warn' },
  ],
});

/**
 * Check if an error represents a dropped or reset database socket
 */
function isConnectionError(error: any): boolean {
  const msg = String(error?.message || '');
  return (
    msg.includes('Closed') ||
    msg.includes('10054') ||
    msg.includes('ConnectionReset') ||
    msg.includes('Server has closed the connection') ||
    msg.includes('Connection was forcibly closed') ||
    error?.code === 'P1017' || // Server has closed the connection
    error?.code === 'P1001'    // Can't reach database server
  );
}

/**
 * Prisma Client extended with automated retry for transient connection drops
 * (e.g. Neon compute sleep or TCP socket timeouts on Windows)
 */
export const prisma = basePrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        let attempts = 0;
        const maxAttempts = 2;
        while (attempts < maxAttempts) {
          try {
            return await query(args);
          } catch (error: any) {
            attempts++;
            if (isConnectionError(error) && attempts < maxAttempts) {
              logger.warn(
                `Database connection reset/closed. Retrying ${model}.${operation} after reconnecting (attempt ${attempts + 1}/${maxAttempts})...`,
                { error: error?.message }
              );
              await basePrisma.$connect().catch(() => {});
              continue;
            }
            throw error;
          }
        }
      },
    },
  },
}) as unknown as PrismaClient;

let keepAliveTimer: NodeJS.Timeout | null = null;

export async function connectDatabase(): Promise<boolean> {
  try {
    await basePrisma.$connect();
    logger.info('✅ PostgreSQL connected successfully via Prisma Client');

    // Keep-alive heartbeat: ping DB every 2.5 minutes to prevent Neon compute sleep and idle socket disconnects
    if (!keepAliveTimer) {
      keepAliveTimer = setInterval(async () => {
        try {
          await basePrisma.$queryRaw`SELECT 1`;
        } catch (err: any) {
          logger.warn('Prisma keep-alive ping encountered issue, reconnecting...', { error: err?.message });
          await basePrisma.$connect().catch(() => {});
        }
      }, 150_000);
      keepAliveTimer.unref();
    }

    return true;
  } catch (error) {
    logger.error('❌ Failed to connect to PostgreSQL:', error);
    return false;
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (keepAliveTimer) {
    clearInterval(keepAliveTimer);
    keepAliveTimer = null;
  }
  await basePrisma.$disconnect();
  logger.info('Database connection closed cleanly.');
}
