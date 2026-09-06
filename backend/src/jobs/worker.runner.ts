import { logger } from '../config/logger';
import { connectDatabase } from '../config/database';
import { initRedis } from '../config/redis';
import { initBackgroundWorkers } from './workers';

async function bootstrapWorkerProcess() {
  logger.info('⚙️ Starting Autonomous Background Worker Process...');
  await connectDatabase();
  initRedis();
  initBackgroundWorkers();
  logger.info('🚀 Worker Process running and listening for background queues.');
}

bootstrapWorkerProcess().catch((err) => {
  logger.error('❌ Fatal error starting worker process:', err);
  process.exit(1);
});
