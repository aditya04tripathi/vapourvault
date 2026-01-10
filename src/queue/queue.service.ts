import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

export interface FileProcessingJobData {
	fileId: string;
	userId: string;
	uploadKey: string;
	bucket: string;
}

@Injectable()
export class QueueService {
	constructor(
		@InjectQueue('file-processing')
		private readonly fileProcessingQueue: Queue<FileProcessingJobData>,
	) {}

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
