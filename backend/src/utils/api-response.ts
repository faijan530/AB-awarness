import { Response } from 'express';

export interface ApiResponseMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  [key: string]: any;
}

export class ApiResponse {
  static success<T>(
    res: Response,
    message: string,
    data: T = {} as T,
    meta?: ApiResponseMeta,
    statusCode: number = 200
  ): Response {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      ...(meta ? { meta } : {}),
    });
  }

  static error(
    res: Response,
    message: string,
    code: string = 'INTERNAL_ERROR',
    details: any = null,
    statusCode: number = 500
  ): Response {
    return res.status(statusCode).json({
      success: false,
      message,
      error: {
        code,
        details,
      },
    });
  }
}
