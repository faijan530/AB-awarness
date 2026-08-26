import winston from 'winston';
import { env } from './env.config';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: logFormat,
  defaultMeta: { service: 'ab-media-backend' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, correlationId, service, stack }) => {
          const reqId = correlationId ? ` [CorrelationID: ${correlationId}]` : '';
          return `[${timestamp}] ${level}${reqId}: ${stack || message}`;
        })
      ),
    }),
  ],
});
