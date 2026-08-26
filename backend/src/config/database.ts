import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

export const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'stdout', level: 'error' },
    { emit: 'stdout', level: 'warn' },
  ],
});

export async function connectDatabase(): Promise<boolean> {
  try {
    await prisma.$connect();
    logger.info('✅ PostgreSQL connected successfully via Prisma Client');
    return true;
  } catch (error) {
    logger.error('❌ Failed to connect to PostgreSQL:', error);
    return false;
  }
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  logger.info('Database connection closed cleanly.');
}
