import { app } from './app';
import { env } from './config/env.config';
import { logger } from './config/logger';
import { connectDatabase, disconnectDatabase } from './config/database';
import { initRedis, disconnectRedis } from './config/redis';

async function bootstrap() {
  logger.info('🚀 Starting Abhishek Bhardwaj Media Backend Server...');

  // Initialize DB Connection
  await connectDatabase();

  // Initialize Redis Connection
  initRedis();

  // Start HTTP Server
  const server = app.listen(env.PORT, () => {
    logger.info(`⚡ [${env.NODE_ENV.toUpperCase()}] Server running on http://localhost:${env.PORT}`);
    logger.info(`📌 Base API Endpoint: http://localhost:${env.PORT}/api/v1`);
  });

  // Graceful Shutdown Handler
  const handleShutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Gracefully shutting down HTTP server...`);
    server.close(async () => {
      logger.info('HTTP server closed.');
      await disconnectDatabase();
      await disconnectRedis();
      logger.info('Graceful shutdown completed successfully.');
      process.exit(0);
    });

    // Force exit after 10s timeout
    setTimeout(() => {
      logger.error('Forced shutdown due to timeout.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));
}

bootstrap().catch((error) => {
  logger.error('❌ Fatal server bootstrap exception:', error);
  process.exit(1);
});
