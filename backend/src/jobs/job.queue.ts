import { logger } from '../config/logger';

export interface Job<T = any> {
  id: string;
  queue: 'media' | 'notification' | 'analytics' | 'seo' | 'maintenance';
  payload: T;
  attempts: number;
  maxAttempts: number;
  createdAt: string;
  lastAttemptAt?: string;
  error?: string;
}

export class JobQueueManager {
  private static activeJobs: Job[] = [];
  private static completedJobs: Job[] = [];
  private static deadLetterQueue: Job[] = [];
  private static workerHandlers: Map<string, (job: Job) => Promise<void>> = new Map();

  /**
   * Register a background worker handler for a specific queue
   */
  static registerWorker(queueName: Job['queue'], handler: (job: Job) => Promise<void>) {
    this.workerHandlers.set(queueName, handler);
    logger.info(`⚙️ Registered background worker for queue: [${queueName.toUpperCase()}]`);
  }

  /**
   * Enqueue a new background job
   */
  static async enqueue<T>(queue: Job['queue'], payload: T, maxAttempts = 3): Promise<Job<T>> {
    const job: Job<T> = {
      id: `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      queue,
      payload,
      attempts: 0,
      maxAttempts,
      createdAt: new Date().toISOString(),
    };

    this.activeJobs.push(job);
    logger.info(`📥 Enqueued Job [${job.id}] into Queue [${queue}]`);

    // Process immediately asynchronously
    setImmediate(() => this.processJob(job));
    return job;
  }

  /**
   * Process a background job with retry and DLQ logic
   */
  private static async processJob(job: Job) {
    const handler = this.workerHandlers.get(job.queue);
    if (!handler) {
      logger.warn(`No handler registered for queue [${job.queue}]. Skipping job ${job.id}`);
      return;
    }

    job.attempts += 1;
    job.lastAttemptAt = new Date().toISOString();

    try {
      logger.info(`▶️ Running Job [${job.id}] (Attempt ${job.attempts}/${job.maxAttempts})`);
      await handler(job);

      // Success
      this.activeJobs = this.activeJobs.filter((j) => j.id !== job.id);
      this.completedJobs.push(job);
      logger.info(`✅ Job [${job.id}] completed successfully.`);
    } catch (err: any) {
      job.error = err.message || String(err);
      logger.error(`❌ Error executing Job [${job.id}]: ${job.error}`);

      if (job.attempts < job.maxAttempts) {
        logger.info(`🔄 Retrying Job [${job.id}] (Attempt ${job.attempts + 1}/${job.maxAttempts})...`);
        setTimeout(() => this.processJob(job), 100);
      } else {
        // Move to Dead Letter Queue (DLQ)
        logger.error(`💀 Job [${job.id}] exceeded max retries. Moving to Dead Letter Queue (DLQ).`);
        this.activeJobs = this.activeJobs.filter((j) => j.id !== job.id);
        this.deadLetterQueue.push(job);
      }
    }
  }

  /**
   * Get Queue Metrics for Monitoring & Operations
   */
  static getMetrics() {
    return {
      active: this.activeJobs.length,
      completed: this.completedJobs.length,
      dlq: this.deadLetterQueue.length,
      registeredWorkers: Array.from(this.workerHandlers.keys()),
    };
  }

  /**
   * Inspect Dead Letter Queue (DLQ)
   */
  static getDLQ() {
    return this.deadLetterQueue;
  }

  /**
   * Clear all queues (used in testing & cleanup)
   */
  static clearAll() {
    this.activeJobs = [];
    this.completedJobs = [];
    this.deadLetterQueue = [];
  }
}
