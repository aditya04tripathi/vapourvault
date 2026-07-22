import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { StorageService } from 'src/storage/storage.service';
import { FileProcessingJobData } from 'src/queue/queue.service';
import { FileStatus, JobStatus, JobCheckpoint } from 'src/generated/client';
import { Readable } from 'stream';

/**
 * Worker processor for handling file processing jobs from the queue.
 */
@Processor('file-processing')
export class FileProcessor extends WorkerHost {
	private readonly logger = new Logger(FileProcessor.name);

	constructor(
		private prisma: PrismaService,
		private storage: StorageService,
	) {
		super();
	}

	/**
	 * Main processing method provided by BullMQ.
	 * Implements checkpoint-based processing for recovery.
	 * @param job - The job instance containing data.
	 * @returns Processing result.
	 */
	async process(job: Job<FileProcessingJobData>) {
		const { fileId, userId, uploadKey, bucket } = job.data;
		const startTime = Date.now();

		this.logger.log(`Processing file ${fileId} (job ${job.id})`);

		try {
			// Get current job state to check for resumable processing
			const jobRecord = await this.prisma.job.findUnique({
				where: { fileId },
			});

			const currentCheckpoint = jobRecord?.checkpoint || JobCheckpoint.INIT;
			this.logger.log(`Starting from checkpoint: ${currentCheckpoint}`);

			await this.updateJobStatus(fileId, JobStatus.PROCESSING, null, new Date(), null);

			await this.prisma.file.update({
				where: { id: fileId },
				data: { status: FileStatus.PROCESSING },
			});

			let fileBuffer: Buffer;
			let processedData: { buffer: Buffer; fileName: string };
			let processedKey: string;
			let processedBucket: string;

			// Checkpoint 1: Retrieve file from storage
			if (currentCheckpoint === JobCheckpoint.INIT) {
				this.logger.log(`Checkpoint: Retrieving file from storage`);
				const fileStream = await this.storage.getObject(bucket, uploadKey);

				const chunks: Buffer[] = [];
				for await (const chunk of fileStream as Readable) {
					chunks.push(chunk);
				}
				fileBuffer = Buffer.concat(chunks);

				await this.saveCheckpoint(fileId, JobCheckpoint.FILE_RETRIEVED, {
					fileSize: fileBuffer.length,
				});
			} else {
				// Retrieve from storage again (checkpoint data doesn't store buffer)
				const fileStream = await this.storage.getObject(bucket, uploadKey);
				const chunks: Buffer[] = [];
				for await (const chunk of fileStream as Readable) {
					chunks.push(chunk);
				}
				fileBuffer = Buffer.concat(chunks);
			}

			// Checkpoint 2: Process file
			if (
				currentCheckpoint === JobCheckpoint.INIT ||
				currentCheckpoint === JobCheckpoint.FILE_RETRIEVED
			) {
				this.logger.log(`Checkpoint: Processing file`);
				processedData = await this.processFile(fileBuffer, job.data);

				await this.saveCheckpoint(fileId, JobCheckpoint.FILE_PROCESSED, {
					processedFileName: processedData.fileName,
				});
			} else {
				processedData = await this.processFile(fileBuffer, job.data);
			}

			// Checkpoint 3: Upload processed data to storage
			if (
				currentCheckpoint === JobCheckpoint.INIT ||
				currentCheckpoint === JobCheckpoint.FILE_RETRIEVED ||
				currentCheckpoint === JobCheckpoint.FILE_PROCESSED
			) {
				this.logger.log(`Checkpoint: Uploading to storage`);
				processedKey = `processed/${userId}/${fileId}/${processedData.fileName}`;
				processedBucket = this.storage.getProcessedBucket();

				await this.storage.putObject(processedBucket, processedKey, processedData.buffer);

				await this.saveCheckpoint(fileId, JobCheckpoint.UPLOADED_TO_STORAGE, {
					processedKey,
					processedBucket,
				});
			} else {
				const cpData = jobRecord?.checkpointData as any;
				processedKey = cpData?.processedKey;
				processedBucket = cpData?.processedBucket;
			}

			// Checkpoint 4: Update file metadata
			if (
				currentCheckpoint !== JobCheckpoint.METADATA_UPDATED &&
				currentCheckpoint !== JobCheckpoint.COMPLETED
			) {
				this.logger.log(`Checkpoint: Updating metadata`);
				await this.prisma.file.update({
					where: { id: fileId },
					data: {
						status: FileStatus.COMPLETED,
						processedBucket: processedBucket,
						processedKey: processedKey,
					},
				});

				await this.saveCheckpoint(fileId, JobCheckpoint.METADATA_UPDATED, {});
			}

			const processingTime = Date.now() - startTime;

			// Final checkpoint: Mark as completed
			await this.updateJobStatus(fileId, JobStatus.COMPLETED, null, null, new Date(), {
				processingTimeMs: processingTime,
				size: fileBuffer.length,
			});

			await this.saveCheckpoint(fileId, JobCheckpoint.COMPLETED, {});

			this.logger.log(`File ${fileId} processed successfully in ${processingTime}ms`);

			return {
				success: true,
				fileId,
				processingTime,
			};
		} catch (error) {
			const processingTime = Date.now() - startTime;
			const errorMessage = error.message || 'Unknown error occurred';

			this.logger.error(`Error processing file ${fileId}: ${errorMessage}`, error.stack);

			await this.prisma.file.update({
				where: { id: fileId },
				data: { status: FileStatus.FAILED },
			});

			await this.updateJobStatus(fileId, JobStatus.FAILED, errorMessage, null, new Date(), {
				processingTimeMs: processingTime,
			});

			throw error;
		}
	}

	/**
	 * Determines processing strategy based on file MIME type.
	 * @param buffer - File content.
	 * @param jobData - Job context.
	 * @returns Processed logic result.
	 */
	private async processFile(
		buffer: Buffer,
		jobData: FileProcessingJobData,
	): Promise<{ buffer: Buffer; fileName: string }> {
		const file = await this.prisma.file.findUnique({
			where: { id: jobData.fileId },
		});

		if (!file) {
			throw new Error('File not found');
		}

		const originalName = file.originalName;
		const extension = originalName.split('.').pop() || 'bin';

		if (file.mimeType.startsWith('image/')) {
			return this.processImage(buffer, originalName, extension);
		} else if (file.mimeType.startsWith('text/')) {
			return this.processText(buffer, originalName, extension);
		} else {
			return this.processGeneric(buffer, originalName, extension);
		}
	}

	private async processImage(
		buffer: Buffer,
		originalName: string,
		extension: string,
	): Promise<{ buffer: Buffer; fileName: string }> {
		const metadata = {
			type: 'image',
			originalExtension: extension,
			processedAt: new Date().toISOString(),
		};

		const metadataBuffer = Buffer.from(JSON.stringify(metadata, null, 2));
		const fileName = `processed_${originalName}.json`;

		return {
			buffer: metadataBuffer,
			fileName,
		};
	}

	private async processText(
		buffer: Buffer,
		originalName: string,
		extension: string,
	): Promise<{ buffer: Buffer; fileName: string }> {
		const text = buffer.toString('utf-8');
		const lines = text.split('\n').length;
		const words = text.split(/\s+/).filter((w) => w.length > 0).length;
		const characters = text.length;

		const metadata = {
			type: 'text',
			originalExtension: extension,
			statistics: {
				lines,
				words,
				characters,
			},
			processedAt: new Date().toISOString(),
		};

		const metadataBuffer = Buffer.from(JSON.stringify(metadata, null, 2));
		const fileName = `processed_${originalName}.json`;

		return {
			buffer: metadataBuffer,
			fileName,
		};
	}

	private async processGeneric(
		buffer: Buffer,
		originalName: string,
		extension: string,
	): Promise<{ buffer: Buffer; fileName: string }> {
		const metadata = {
			type: 'generic',
			originalExtension: extension,
			size: buffer.length,
			processedAt: new Date().toISOString(),
		};

		const metadataBuffer = Buffer.from(JSON.stringify(metadata, null, 2));
		const fileName = `processed_${originalName}.json`;

		return {
			buffer: metadataBuffer,
			fileName,
		};
	}

	private async updateJobStatus(
		fileId: string,
		status: JobStatus,
		errorMessage: string | null,
		startedAt: Date | null,
		completedAt: Date | null,
		metadata?: any,
	) {
		const job = await this.prisma.job.findUnique({
			where: { fileId },
		});

		if (!job) {
			throw new Error(`Job not found for file ${fileId}`);
		}

		await this.prisma.job.update({
			where: { fileId },
			data: {
				status,
				errorMessage,
				startedAt,
				completedAt,
				metadata: metadata || job.metadata,
			},
		});
	}

	/**
	 * Save a checkpoint for a job to enable recovery from failures.
	 * @param fileId - File ID
	 * @param checkpoint - Checkpoint identifier
	 * @param data - Checkpoint data to persist
	 */
	private async saveCheckpoint(fileId: string, checkpoint: JobCheckpoint, data: any) {
		await this.prisma.job.update({
			where: { fileId },
			data: {
				checkpoint,
				checkpointData: data,
				lastCheckpointAt: new Date(),
			},
		});

		this.logger.log(`Checkpoint saved: ${checkpoint} for file ${fileId}`);
	}
}
