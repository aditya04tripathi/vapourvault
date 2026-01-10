import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { QueueService } from '../src/queue/queue.service';
import { StorageService } from '../src/storage/storage.service';
import * as argon from 'argon2';
import { FileStatus, JobStatus } from '@prisma/client';

describe('Job Processing (e2e)', () => {
	let app: INestApplication;
	let prisma: PrismaService;
	let queueService: QueueService;
	let storageService: StorageService;
	let userId: string;

	beforeAll(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [AppModule],
		}).compile();

		app = moduleFixture.createNestApplication();
		await app.init();

		prisma = moduleFixture.get<PrismaService>(PrismaService);
		queueService = moduleFixture.get<QueueService>(QueueService);
		storageService = moduleFixture.get<StorageService>(StorageService);

		const hashedPassword = await argon.hash('password123');
		const user = await prisma.user.create({
			data: {
				email: 'jobtest@example.com',
				name: 'Job Test User',
				hashedPassword,
			},
		});
		userId = user.id;
	});

	afterAll(async () => {
		await prisma.file.deleteMany({ where: { userId } });
		await prisma.user.delete({ where: { id: userId } });
		await app.close();
	});

	it('should create job when upload is completed', async () => {
		const file = await prisma.file.create({
			data: {
				userId,
				originalName: 'test.pdf',
				mimeType: 'application/pdf',
				size: 1024,
				status: FileStatus.UPLOADED,
				uploadBucket: 'uploads',
				uploadKey: 'uploads/test/file.pdf',
			},
		});

		const job = await queueService.addFileProcessingJob({
			fileId: file.id,
			userId: file.userId,
			uploadKey: file.uploadKey,
			bucket: file.uploadBucket,
		});

		expect(job.id).toBeDefined();

		const dbJob = await prisma.job.create({
			data: {
				id: job.id!,
				fileId: file.id,
				status: JobStatus.PENDING,
			},
		});

		expect(dbJob).toBeDefined();
		expect(dbJob.fileId).toBe(file.id);
		expect(dbJob.status).toBe(JobStatus.PENDING);

		await prisma.job.delete({ where: { id: dbJob.id } });
		await prisma.file.delete({ where: { id: file.id } });
	});

	it('should update job status correctly', async () => {
		const file = await prisma.file.create({
			data: {
				userId,
				originalName: 'test.pdf',
				mimeType: 'application/pdf',
				size: 1024,
				status: FileStatus.UPLOADED,
				uploadBucket: 'uploads',
				uploadKey: 'uploads/test/file.pdf',
			},
		});

		const job = await prisma.job.create({
			data: {
				id: 'test-job-id',
				fileId: file.id,
				status: JobStatus.PENDING,
			},
		});

		await prisma.job.update({
			where: { fileId: file.id },
			data: {
				status: JobStatus.PROCESSING,
				startedAt: new Date(),
			},
		});

		const updatedJob = await prisma.job.findUnique({
			where: { fileId: file.id },
		});

		expect(updatedJob?.status).toBe(JobStatus.PROCESSING);
		expect(updatedJob?.startedAt).toBeDefined();

		await prisma.job.delete({ where: { id: job.id } });
		await prisma.file.delete({ where: { id: file.id } });
	});

	it('should handle job failure with error message', async () => {
		const file = await prisma.file.create({
			data: {
				userId,
				originalName: 'test.pdf',
				mimeType: 'application/pdf',
				size: 1024,
				status: FileStatus.PROCESSING,
				uploadBucket: 'uploads',
				uploadKey: 'uploads/test/file.pdf',
			},
		});

		const job = await prisma.job.create({
			data: {
				id: 'failed-job-id',
				fileId: file.id,
				status: JobStatus.PROCESSING,
				startedAt: new Date(),
			},
		});

		await prisma.job.update({
			where: { fileId: file.id },
			data: {
				status: JobStatus.FAILED,
				errorMessage: 'Processing failed: File format not supported',
				completedAt: new Date(),
			},
		});

		await prisma.file.update({
			where: { id: file.id },
			data: {
				status: FileStatus.FAILED,
			},
		});

		const failedJob = await prisma.job.findUnique({
			where: { fileId: file.id },
		});

		expect(failedJob?.status).toBe(JobStatus.FAILED);
		expect(failedJob?.errorMessage).toBe('Processing failed: File format not supported');
		expect(failedJob?.completedAt).toBeDefined();

		await prisma.job.delete({ where: { id: job.id } });
		await prisma.file.delete({ where: { id: file.id } });
	});
});
