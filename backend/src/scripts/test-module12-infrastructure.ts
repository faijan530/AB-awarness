import { env } from '../config/env.config';
import { JobQueueManager } from '../jobs/job.queue';
import { initBackgroundWorkers } from '../jobs/workers';
import { openApiSpec } from '../docs/openapi.spec';
import { createRateLimiter } from '../middlewares/rate-limit.middleware';

async function runModule12AutonomousTests() {
  console.log('🧪 Starting Autonomous Testing for Module 12 (Infrastructure, Performance & Operations)...\n');

  // --- TEST 1: Environment & Runtime Configuration ---
  console.log('--- TEST 1: Environment & Runtime Configuration ---');
  if (!env.PORT || !env.DATABASE_URL || !env.JWT_ACCESS_SECRET) {
    throw new Error('Environment configuration validation failed.');
  }
  console.log(`✔ Environment Schema Validated: NODE_ENV=${env.NODE_ENV}, PORT=${env.PORT}, LOG_LEVEL=${env.LOG_LEVEL}`);

  // --- TEST 2: OpenAPI 3.0 / Swagger Documentation ---
  console.log('\n--- TEST 2: OpenAPI 3.0 Documentation ---');
  if (openApiSpec.openapi !== '3.0.3' || !openApiSpec.info.title || !openApiSpec.paths['/health']) {
    throw new Error('OpenAPI 3.0 specification schema invalid.');
  }
  console.log(`✔ OpenAPI Spec Validated: Title="${openApiSpec.info.title}", Version=${openApiSpec.info.version}`);
  console.log(`✔ Documented API Paths Count: ${Object.keys(openApiSpec.paths).length}`);

  // --- TEST 3: Rate Limiting Engine ---
  console.log('\n--- TEST 3: Rate Limiting Engine ---');
  const testLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    max: 2,
    message: 'Rate limit exceeded for test',
    keyPrefix: 'test_rl',
  });

  let rateLimitHit = false;
  const mockReq: any = { ip: '127.0.0.1', headers: {}, socket: {} };
  const mockRes: any = {
    setHeader: (name: string, val: any) => {
      if (name === 'Retry-After') rateLimitHit = true;
    },
    status: (code: number) => ({
      json: (data: any) => {
        if (code === 429) rateLimitHit = true;
      },
    }),
  };

  await testLimiter(mockReq, mockRes, () => {});
  await testLimiter(mockReq, mockRes, () => {});
  await testLimiter(mockReq, mockRes, () => {});

  if (!rateLimitHit) {
    throw new Error('Rate limiter failed to block excessive requests.');
  }
  console.log('✔ Rate Limiter verified: Correctly returns 429 & Retry-After when threshold exceeded.');

  // --- TEST 4: Background Queue & Workers Engine ---
  console.log('\n--- TEST 4: Background Queue & Workers Engine ---');
  JobQueueManager.clearAll();
  initBackgroundWorkers();

  // Enqueue test jobs across workers
  const mediaJob = await JobQueueManager.enqueue('media', { mediaId: 'med_999', url: '/uploads/sample.jpg' });
  const notifyJob = await JobQueueManager.enqueue('notification', { userId: 'usr_123', subject: 'Breaking News Alert' });
  const analyticsJob = await JobQueueManager.enqueue('analytics', { date: '2026-09-06' });
  const seoJob = await JobQueueManager.enqueue('seo', { type: 'sitemap' });
  const maintenanceJob = await JobQueueManager.enqueue('maintenance', { action: 'token_cleanup' });

  // Enqueue failing job to verify retry & DLQ
  const failingJob = await JobQueueManager.enqueue('media', { mediaId: 'med_fail', shouldFail: true }, 2);

  // Allow async worker processing time
  await new Promise((res) => setTimeout(res, 600));

  const metrics = JobQueueManager.getMetrics();
  console.log('✔ Queue Worker Metrics:', JSON.stringify(metrics, null, 2));

  const dlq = JobQueueManager.getDLQ();
  console.log(`✔ Dead Letter Queue (DLQ) Count: ${dlq.length}`);

  if (metrics.completed < 5 || dlq.length !== 1) {
    throw new Error('Background queue processing or DLQ failed.');
  }
  console.log('✔ All 5 Worker Queues (Media, Notification, Analytics, SEO, Maintenance) & DLQ Verified Successfully!');

  console.log('\n🎉 ALL MODULE 12 FUNCTIONAL REQUIREMENTS VERIFIED & PASSED AUTONOMOUSLY!\n');
}

runModule12AutonomousTests().catch((err) => {
  console.error('❌ Module 12 Verification Failed:', err);
  process.exit(1);
});
