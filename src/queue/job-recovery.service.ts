import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, Job as BullJob } from 'bullmq';
import { PrismaService } from 'src/prisma/prisma.service';
import { JobStatus } from 'src/generated/client';
import { FileProcessingJobData } from './queue.service';

/**
 * Service for recovering interrupted or failed jobs.
 * Implements Dead Letter Queue (DLQ) handling and manual retry logic.
 */
@Injectable()
export class JobRecoveryService implements OnModuleInit {
	private readonly logger = new Logger(JobRecoveryService.name);

	constructor(
		@InjectQueue('file-processing')
		private readonly fileProcessingQueue: Queue<FileProcessingJobData>,
		private readonly prisma: PrismaService,
	) {}

	/**
	 * On module initialization, recover any stuck processing jobs
	 * (jobs that were processing when service crashed)
	 */
	async onModuleInit() {
		await this.recoverInterruptedJobs();
	}

	/**
	 * Recover jobs that were interrupted due to service crash
	 */
	async recoverInterruptedJobs() {
		this.logger.log('Checking for interrupted jobs...');

		const interruptedJobs = await this.prisma.job.findMany({
			where: {
				status: JobStatus.PROCESSING,
			},
			include: {
				file: true,
			},
		});

		if (interruptedJobs.length > 0) {
			this.logger.warn(`Found ${interruptedJobs.length} interrupted jobs. Attempting recovery...`);

			for (const job of interruptedJobs) {
				try {
					// Reset job status to pending
					await this.prisma.job.update({
						where: { id: job.id },
						data: {
							status: JobStatus.PENDING,
							retryCount: job.retryCount + 1,
						},
					});

					// Re-enqueue the job (will resume from last checkpoint)
					await this.fileProcessingQueue.add('process-file', {
						fileId: job.fileId,
						userId: 'anonymous',
						uploadKey: job.file.uploadKey,
						bucket: job.file.uploadBucket,
					});

					this.logger.log(`Recovered interrupted job: ${job.id}`);
				} catch (error) {
					this.logger.error(`Failed to recover job ${job.id}: ${error.message}`);
				}
			}
		} else {
			this.logger.log('No interrupted jobs found.');
		}
	}

	/**
	 * Get failed jobs (Dead Letter Queue)
	 * @param limit - Maximum number of failed jobs to retrieve
	 * @returns Array of failed job details
	 */
	async getFailedJobs(limit: number = 100) {
		const failedJobs = await this.fileProcessingQueue.getFailed(0, limit - 1);

		return failedJobs.map((job) => ({
			id: job.id,
			data: job.data,
			failedReason: job.failedReason,
			attemptsMade: job.attemptsMade,
			timestamp: job.timestamp,
			stacktrace: job.stacktrace,
		}));
	}

	/**
	 * Manually retry a specific failed job
	 * @param jobId - The BullMQ job ID
	 * @returns Result of retry operation
	 */
	async retryFailedJob(jobId: string) {
		try {
			const job = await this.fileProcessingQueue.getJob(jobId);

			if (!job) {
				throw new Error(`Job ${jobId} not found`);
			}

			const state = await job.getState();

			if (state !== 'failed') {
				throw new Error(`Job ${jobId} is not in failed state (current state: ${state})`);
			}

			// Retry the job
			await job.retry();

			this.logger.log(`Retrying job: ${jobId}`);

			return {
				success: true,
				message: `Job ${jobId} has been retried`,
			};
		} catch (error) {
			this.logger.error(`Error retrying job ${jobId}: ${error.message}`);
			throw error;
		}
	}

	/**
	 * Manually retry all failed jobs in the DLQ
	 * @param maxRetries - Maximum number of jobs to retry
	 * @returns Results of retry operations
	 */
	async retryAllFailedJobs(maxRetries: number = 50) {
		const failedJobs = await this.fileProcessingQueue.getFailed(0, maxRetries - 1);

		this.logger.log(`Retrying ${failedJobs.length} failed jobs...`);

		const results: Array<{ jobId: string | undefined; success: boolean; error?: string }> = [];

		for (const job of failedJobs) {
			try {
				await job.retry();
				results.push({
					jobId: job.id,
					success: true,
				});
			} catch (error) {
				results.push({
					jobId: job.id,
					success: false,
					error: error.message,
				});
			}
		}

		return results;
	}

	/**
	 * Get DLQ statistics
	 * @returns Statistics about failed jobs
	 */
	async getDLQStats() {
		const failedCount = await this.fileProcessingQueue.getFailedCount();
		const activeCount = await this.fileProcessingQueue.getActiveCount();
		const waitingCount = await this.fileProcessingQueue.getWaitingCount();
		const completedCount = await this.fileProcessingQueue.getCompletedCount();

		return {
			failed: failedCount,
			active: activeCount,
			waiting: waitingCount,
			completed: completedCount,
		};
	}

	/**
	 * Remove a job from the DLQ permanently
	 * @param jobId - The BullMQ job ID
	 */
	async removeFailedJob(jobId: string) {
		try {
			const job = await this.fileProcessingQueue.getJob(jobId);

			if (!job) {
				throw new Error(`Job ${jobId} not found`);
			}

			await job.remove();

			this.logger.log(`Removed failed job: ${jobId}`);

			return {
				success: true,
				message: `Job ${jobId} removed from DLQ`,
			};
		} catch (error) {
			this.logger.error(`Error removing job ${jobId}: ${error.message}`);
			throw error;
		}
	}

	/**
	 * Clean up old completed jobs to prevent memory bloat
	 * @param olderThanMs - Remove jobs older than this (milliseconds)
	 */
	async cleanupOldJobs(olderThanMs: number = 86400000) {
		// 24 hours
		try {
			const cleaned = await this.fileProcessingQueue.clean(olderThanMs, 1000, 'completed');
			this.logger.log(`Cleaned up ${cleaned.length} old completed jobs`);
			return cleaned;
		} catch (error) {
			this.logger.error(`Error cleaning up old jobs: ${error.message}`);
			throw error;
		}
	}
}
