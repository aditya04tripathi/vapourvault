import {
	Injectable,
	NotFoundException,
	BadRequestException,
	ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { StorageService } from 'src/storage/storage.service';
import { QueueService } from 'src/queue/queue.service';
import {
	PresignUploadDto,
	CompleteUploadDto,
	FileStatusResponseDto,
	DownloadResponseDto,
} from './dto';
import { FileStatus, JobStatus } from '../generated/client';
import { v4 as uuidv4 } from 'uuid';

/**
 * Service handling file storage operations, metadata management, and processing job coordination.
 */
@Injectable()
export class FileService {
	constructor(
		private prisma: PrismaService,
		private storage: StorageService,
		private queue: QueueService,
	) {}

	/**
	 * Uploads a file directly, saves metadata, and enqueues a processing job.
	 * @param file - The file object from Multer.
	 * @returns Object containing success message and file IDs.
	 */
	async uploadFile(file: Express.Multer.File) {
		const fileId = uuidv4();
		const extension = file.originalname.split('.').pop();
		const uploadKey = `uploads/anonymous/${fileId}/${file.originalname}`;
		const bucket = this.storage.getUploadsBucket();

		try {
			await this.storage.putObject(bucket, uploadKey, file.buffer, file.size, {
				'Content-Type': file.mimetype,
			});
		} catch (error) {
			throw new BadRequestException('Failed to upload file to storage');
		}

		const fileRecord = await this.prisma.file.create({
			data: {
				id: fileId,
				originalName: file.originalname,
				mimeType: file.mimetype,
				size: file.size,
				status: FileStatus.UPLOADED,
				uploadBucket: bucket,
				uploadKey: uploadKey,
			},
		});

		const job = await this.queue.addFileProcessingJob({
			fileId: fileRecord.id,
			userId: 'anonymous',
			uploadKey: fileRecord.uploadKey,
			bucket: fileRecord.uploadBucket,
		});

		await this.prisma.job.create({
			data: {
				id: job.id!,
				fileId: fileRecord.id,
				status: JobStatus.PENDING,
			},
		});

		return {
			message: 'File uploaded successfully and processing started',
			fileId: fileRecord.id,
			jobId: job.id,
		};
	}

	/**
	 * Generates a presigned URL for direct client-to-storage upload.
	 * @param dto - DTO containing file metadata.
	 * @returns Presigned URL and file details.
	 */
	async presignUpload(dto: PresignUploadDto) {
		const fileId = uuidv4();
		const uploadKey = `uploads/anonymous/${fileId}/${dto.fileName}`;
		const bucket = this.storage.getUploadsBucket();

		const presignedUrl = await this.storage.generatePresignedUploadUrl(bucket, uploadKey, 3600);

		const file = await this.prisma.file.create({
			data: {
				id: fileId,
				originalName: dto.fileName,
				mimeType: dto.mimeType,
				size: dto.size,
				status: FileStatus.PENDING,
				uploadBucket: bucket,
				uploadKey: uploadKey,
			},
		});

		return {
			fileId: file.id,
			uploadUrl: presignedUrl,
			uploadKey: uploadKey,
			expiresIn: 3600,
		};
	}

	/**
	 * Marks a presigned upload as complete and enqueues a processing job.
	 * @param dto - DTO containing completion details.
	 * @returns Object containing success message.
	 */
	async completeUpload(dto: CompleteUploadDto) {
		const file = await this.prisma.file.findUnique({
			where: { id: dto.fileId },
			include: { job: true },
		});

		if (!file) {
			throw new NotFoundException('File not found');
		}

		if (file.uploadKey !== dto.uploadKey) {
			throw new BadRequestException('Upload key does not match');
		}

		const exists = await this.storage.objectExists(file.uploadBucket, file.uploadKey);
		if (!exists) {
			throw new NotFoundException('File not found in storage');
		}

		await this.prisma.file.update({
			where: { id: file.id },
			data: { status: FileStatus.UPLOADED },
		});

		const job = await this.queue.addFileProcessingJob({
			fileId: file.id,
			userId: 'anonymous',
			uploadKey: file.uploadKey,
			bucket: file.uploadBucket,
		});

		await this.prisma.job.create({
			data: {
				id: job.id!,
				fileId: file.id,
				status: JobStatus.PENDING,
			},
		});

		return {
			message: 'Upload completed and processing job enqueued',
			fileId: file.id,
			jobId: job.id,
		};
	}

	/**
	 * Retrieves the status of a file and its processing job.
	 * @param fileId - ID of the file.
	 * @returns File status DTO.
	 */
	async getFileStatus(fileId: string): Promise<FileStatusResponseDto> {
		const file = await this.prisma.file.findUnique({
			where: { id: fileId },
			include: { job: true },
		});

		if (!file) {
			throw new NotFoundException('File not found');
		}

		return {
			id: file.id,
			originalName: file.originalName,
			mimeType: file.mimeType,
			size: file.size,
			status: file.status,
			jobStatus: file.job?.status,
			errorMessage: file.job?.errorMessage || undefined,
			createdAt: file.createdAt,
			updatedAt: file.updatedAt,
		};
	}

	/**
	 * Generates a presigned download URL for a file.
	 * @param fileId - ID of the file.
	 * @returns Download URL DTO.
	 */
	async getDownloadUrl(fileId: string): Promise<DownloadResponseDto> {
		const file = await this.prisma.file.findUnique({
			where: { id: fileId },
		});

		if (!file) {
			throw new NotFoundException('File not found');
		}

		if (file.status !== FileStatus.COMPLETED && file.status !== FileStatus.UPLOADED) {
			throw new BadRequestException('File is not ready for download');
		}

		const downloadUrl = await this.storage.generatePresignedDownloadUrl(
			file.uploadBucket,
			file.uploadKey,
			3600,
		);

		return {
			url: downloadUrl,
			expiresIn: 3600,
			fileName: file.originalName,
		};
	}

	/**
	 * Deletes a file and its associated data from storage and database.
	 * @param fileId - ID of the file.
	 * @returns Success message.
	 */
	async deleteFile(fileId: string) {
		const file = await this.prisma.file.findUnique({
			where: { id: fileId },
		});

		if (!file) {
			throw new NotFoundException('File not found');
		}

		try {
			await this.storage.deleteObject(file.uploadBucket, file.uploadKey);
		} catch (error) {
			console.error(`Error deleting upload file: ${error.message}`);
		}

		if (file.processedKey) {
			try {
				await this.storage.deleteObject(file.processedBucket!, file.processedKey);
			} catch (error) {
				console.error(`Error deleting processed file: ${error.message}`);
			}
		}

		await this.prisma.file.delete({
			where: { id: fileId },
		});

		return {
			message: 'File deleted successfully',
		};
	}
	/**
	 * Lists all files currently in the storage bucket (Debug/Admin).
	 * @returns List of objects in storage.
	 */
	async listFilesFromStorage() {
		const bucket = this.storage.getUploadsBucket();
		try {
			return await this.storage.listObjects(bucket, 'uploads/anonymous/', true);
		} catch (error) {
			throw new BadRequestException('Failed to list files from storage');
		}
	}
}
