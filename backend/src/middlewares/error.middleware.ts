import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/api-response';
import { logger } from '../config/logger';
import { env } from '../config/env.config';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details: any;

  constructor(message: string, statusCode = 500, code = 'INTERNAL_SERVER_ERROR', details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export function globalErrorMiddleware(
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): Response {
  const correlationId = req.correlationId;

  if (err instanceof AppError) {
    logger.warn(`Operational AppError [${err.code}]: ${err.message}`, { correlationId });
    return ApiResponse.error(res, err.message, err.code, err.details, err.statusCode);
  }

  // Unhandled error
  logger.error('Unhandled System Exception:', { error: err, correlationId, stack: err.stack });

  const message = env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message;
  return ApiResponse.error(res, message, 'INTERNAL_SERVER_ERROR', null, 500);
}
