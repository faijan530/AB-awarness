import { PrismaClient } from '@prisma/client';
import { prisma } from '../config/database';

export type TransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

/**
 * Execute a callback within an isolated Prisma database transaction.
 */
export async function executeTransaction<T>(
  callback: (tx: TransactionClient) => Promise<T>,
  timeoutMs: number = 10000
): Promise<T> {
  return await prisma.$transaction(async (tx) => {
    return await callback(tx as unknown as TransactionClient);
  }, {
    timeout: timeoutMs,
  });
}
