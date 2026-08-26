import { Request, Response } from 'express';
import { ApiResponse } from '../../utils/api-response';
import { isRedisConnected } from '../../config/redis';
import { prisma } from '../../config/database';

export class HealthController {
  public static async getHealth(_req: Request, res: Response): Promise<Response> {
    let dbStatus = 'disconnected';
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = 'connected';
    } catch {
      dbStatus = 'disconnected';
    }

    return ApiResponse.success(res, 'Health status fetched', {
      status: 'UP',
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus,
        redis: isRedisConnected ? 'connected' : 'disconnected/fallback',
      },
    });
  }

  public static getLiveness(_req: Request, res: Response): Response {
    return ApiResponse.success(res, 'Process is live', { live: true });
  }

  public static async getReadiness(_req: Request, res: Response): Promise<Response> {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return ApiResponse.success(res, 'System ready', { ready: true });
    } catch (error) {
      return ApiResponse.error(res, 'Database not ready', 'NOT_READY', null, 530);
    }
  }
}
