import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

/**
 * Interface definition for file processing job data.
 */
export interface FileProcessingJobData {
	fileId: string;
	userId: string;
	uploadKey: string;
	bucket: string;
}

/**
 * Service for managing the file processing job queue.
 */
@Injectable()
export class QueueService {
	constructor(
		@InjectQueue('file-processing')
		private readonly fileProcessingQueue: Queue<FileProcessingJobData>,
	) {}

	/**
	 * Adds a file processing job to the queue.
	 * @param data - Job data including file ID and storage paths.
	 * @returns The created job.
	 */
	async addFileProcessingJob(data: FileProcessingJobData) {
		return await this.fileProcessingQueue.add('process-file', data, {
			attempts: 3,
			backoff: {
				type: 'exponential',
				delay: 2000,
			},
			removeOnComplete: {
				age: 3600,
				count: 1000,
			},
			removeOnFail: {
				age: 86400,
			},
		});
	}

	/**
	 * Retrieves the status and progress of a specific job.
	 * @param jobId - ID of the job.
	 * @returns Job details object or null if not found.
	 */
	async getJobStatus(jobId: string) {
		const job = await this.fileProcessingQueue.getJob(jobId);
		if (!job) {
			return null;
		}

		const state = await job.getState();
		const progress = job.progress;
		const returnValue = job.returnvalue;
		const failedReason = job.failedReason;

		return {
			id: job.id,
			name: job.name,
			data: job.data,
			state,
			progress,
			returnValue,
			failedReason,
			attemptsMade: job.attemptsMade,
			timestamp: job.timestamp,
		};
	}
}
