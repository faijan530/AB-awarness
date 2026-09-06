import { Request, Response, NextFunction } from 'express';

export async function maintenanceMiddleware(_req: Request, _res: Response, next: NextFunction): Promise<void> {
  next();
}


