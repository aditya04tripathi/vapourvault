import { Test, TestingModule } from '@nestjs/testing';
import { FileProcessor } from './worker.processor';
import { PrismaService } from 'src/prisma/prisma.service';
import { StorageService } from 'src/storage/storage.service';
import { Job } from 'bullmq';
import { FileStatus, JobStatus } from '../generated/client';
import { Readable } from 'stream';

describe('FileProcessor', () => {
	let processor: FileProcessor;
	let prismaService: PrismaService;
	let storageService: StorageService;

	const mockPrismaService = {
		file: {
			findUnique: jest.fn(),
			update: jest.fn(),
		},
		job: {
			findUnique: jest.fn(),
			update: jest.fn(),
		},
	};

	const mockStorageService = {
		getObject: jest.fn(),
		putObject: jest.fn(),
		getProcessedBucket: jest.fn(() => 'processed'),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				FileProcessor,
				{
					provide: PrismaService,
					useValue: mockPrismaService,
				},
				{
					provide: StorageService,
					useValue: mockStorageService,
				},
			],
		}).compile();

		processor = module.get<FileProcessor>(FileProcessor);
		prismaService = module.get<PrismaService>(PrismaService);
		storageService = module.get<StorageService>(StorageService);

		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(processor).toBeDefined();
	});

	describe('process', () => {
		it('should process file successfully', async () => {
			const fileId = 'file123';
			const userId = 'user123';
			const uploadKey = 'uploads/user123/file123/test.pdf';
			const bucket = 'uploads';

			const mockJob = {
				id: 'job123',
				data: {
					fileId,
					userId,
					uploadKey,
					bucket,
				},
			} as Job;

			const mockFile = {
				id: fileId,
				userId,
				originalName: 'test.pdf',
				mimeType: 'application/pdf',
			};

			const fileBuffer = Buffer.from('test file content');
			const stream = Readable.from([fileBuffer]);

			mockPrismaService.file.findUnique.mockResolvedValue(mockFile);
			mockStorageService.getObject.mockResolvedValue(stream);
			mockPrismaService.job.findUnique.mockResolvedValue({
				id: 'job123',
				fileId,
				status: JobStatus.PENDING,
			});
			mockPrismaService.job.update.mockResolvedValue({});
			mockPrismaService.file.update.mockResolvedValue({});
			mockStorageService.putObject.mockResolvedValue(undefined);

			const result = await processor.process(mockJob);

			expect(result).toHaveProperty('success', true);
			expect(result).toHaveProperty('fileId', fileId);
			expect(mockStorageService.getObject).toHaveBeenCalledWith(bucket, uploadKey);
			expect(mockStorageService.putObject).toHaveBeenCalled();
			expect(mockPrismaService.file.update).toHaveBeenCalledWith(
				expect.objectContaining({
					where: { id: fileId },
					data: expect.objectContaining({
						status: FileStatus.COMPLETED,
					}),
				}),
			);
		});

		it('should handle processing errors', async () => {
			const fileId = 'file123';
			const userId = 'user123';
			const uploadKey = 'uploads/user123/file123/test.pdf';
			const bucket = 'uploads';

			const mockJob = {
				id: 'job123',
				data: {
					fileId,
					userId,
					uploadKey,
					bucket,
				},
			} as Job;

			mockPrismaService.job.findUnique.mockResolvedValue({
				id: 'job123',
				fileId,
				status: JobStatus.PENDING,
			});
			mockPrismaService.job.update.mockResolvedValue({});
			mockPrismaService.file.update.mockResolvedValue({});
			mockStorageService.getObject.mockRejectedValue(new Error('Storage error'));

			await expect(processor.process(mockJob)).rejects.toThrow();

			expect(mockPrismaService.file.update).toHaveBeenCalledWith(
				expect.objectContaining({
					where: { id: fileId },
					data: { status: FileStatus.FAILED },
				}),
			);
		});
	});
});
