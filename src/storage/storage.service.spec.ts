import { Test, TestingModule } from '@nestjs/testing';
import { StorageService } from './storage.service';
import { ConfigService } from '@nestjs/config';
import * as MinIO from 'minio';

jest.mock('minio');

describe('StorageService', () => {
	let service: StorageService;
	let configService: ConfigService;

	const mockMinioClient = {
		bucketExists: jest.fn(),
		makeBucket: jest.fn(),
		presignedPutObject: jest.fn(),
		presignedGetObject: jest.fn(),
		getObject: jest.fn(),
		putObject: jest.fn(),
		removeObject: jest.fn(),
		statObject: jest.fn(),
	};

	beforeEach(async () => {
		(MinIO.Client as jest.Mock).mockImplementation(() => mockMinioClient);

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				StorageService,
				{
					provide: ConfigService,
					useValue: {
						get: jest.fn((key: string) => {
							const config: Record<string, string> = {
								MINIO_ENDPOINT: 'localhost',
								MINIO_PORT: '9000',
								MINIO_USE_SSL: 'false',
								MINIO_ACCESS_KEY: 'minioadmin',
								MINIO_SECRET_KEY: 'minioadmin',
							};
							return config[key];
						}),
					},
				},
			],
		}).compile();

		service = module.get<StorageService>(StorageService);
		configService = module.get<ConfigService>(ConfigService);

		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('onModuleInit', () => {
		it('should ensure buckets exist', async () => {
			mockMinioClient.bucketExists.mockResolvedValue(true);

			await service.onModuleInit();

			expect(mockMinioClient.bucketExists).toHaveBeenCalledTimes(2);
		});

		it('should create buckets if they do not exist', async () => {
			mockMinioClient.bucketExists.mockResolvedValue(false);
			mockMinioClient.makeBucket.mockResolvedValue(undefined);

			await service.onModuleInit();

			expect(mockMinioClient.makeBucket).toHaveBeenCalledTimes(2);
		});
	});

	describe('generatePresignedUploadUrl', () => {
		it('should generate presigned PUT URL', async () => {
			const bucket = 'uploads';
			const key = 'test/file.pdf';
			const url = 'https://presigned-url.com';

			mockMinioClient.presignedPutObject.mockResolvedValue(url);

			const result = await service.generatePresignedUploadUrl(bucket, key, 3600);

			expect(result).toBe(url);
			expect(mockMinioClient.presignedPutObject).toHaveBeenCalledWith(bucket, key, 3600);
		});
	});

	describe('generatePresignedDownloadUrl', () => {
		it('should generate presigned GET URL', async () => {
			const bucket = 'processed';
			const key = 'test/file.pdf';
			const url = 'https://download-url.com';

			mockMinioClient.presignedGetObject.mockResolvedValue(url);

			const result = await service.generatePresignedDownloadUrl(bucket, key, 3600);

			expect(result).toBe(url);
			expect(mockMinioClient.presignedGetObject).toHaveBeenCalledWith(bucket, key, 3600);
		});
	});

	describe('objectExists', () => {
		it('should return true if object exists', async () => {
			const bucket = 'uploads';
			const key = 'test/file.pdf';

			mockMinioClient.statObject.mockResolvedValue({});

			const result = await service.objectExists(bucket, key);

			expect(result).toBe(true);
		});

		it('should return false if object does not exist', async () => {
			const bucket = 'uploads';
			const key = 'test/file.pdf';

			const error = new Error('Not found');
			(error as any).code = 'NotFound';
			mockMinioClient.statObject.mockRejectedValue(error);

			const result = await service.objectExists(bucket, key);

			expect(result).toBe(false);
		});
	});

	describe('deleteObject', () => {
		it('should delete object', async () => {
			const bucket = 'uploads';
			const key = 'test/file.pdf';

			mockMinioClient.removeObject.mockResolvedValue(undefined);

			await service.deleteObject(bucket, key);

			expect(mockMinioClient.removeObject).toHaveBeenCalledWith(bucket, key);
		});
	});
});
