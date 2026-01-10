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

@Injectable()
export class FileService {
	constructor(
		private prisma: PrismaService,
		private storage: StorageService,
		private queue: QueueService,
	) {}

	async uploadFile(file: Express.Multer.File) {
		const fileId = uuidv4();
		const extension = file.originalname.split('.').pop();
		// Use 'anonymous' for userId
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
				status: FileStatus.UPLOADED, // Directly uploaded
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

	async presignUpload(dto: PresignUploadDto) {
		const fileId = uuidv4();
		// Use 'anonymous' for userId in path since auth is removed
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
			userId: 'anonymous', // Mock userId for job
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
	async listFilesFromStorage() {
		const bucket = this.storage.getUploadsBucket();
		try {
			return await this.storage.listObjects(bucket, 'uploads/anonymous/', true);
		} catch (error) {
			throw new BadRequestException('Failed to list files from storage');
		}
	}
}
