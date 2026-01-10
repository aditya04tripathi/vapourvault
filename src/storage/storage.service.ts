import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as MinIO from 'minio';

@Injectable()
export class StorageService implements OnModuleInit {
	private readonly logger = new Logger(StorageService.name);
	private minioClient: MinIO.Client;
	private readonly uploadsBucket = 'uploads';
	private readonly processedBucket = 'processed';

	constructor(private config: ConfigService) {
		const endpoint = this.config.get<string>('MINIO_ENDPOINT') || 'localhost';
		const port = parseInt(this.config.get<string>('MINIO_PORT') || '9000', 10);
		const useSSL = this.config.get<string>('MINIO_USE_SSL') === 'true';
		const accessKey = this.config.get<string>('MINIO_ACCESS_KEY') || 'minioadmin';
		const secretKey = this.config.get<string>('MINIO_SECRET_KEY') || 'minioadmin';

		this.minioClient = new MinIO.Client({
			endPoint: endpoint,
			port: port,
			useSSL: useSSL,
			accessKey: accessKey,
			secretKey: secretKey,
		});
	}

	async onModuleInit() {
		await this.ensureBucketsExist();
	}

	private async ensureBucketsExist() {
		try {
			const buckets = [this.uploadsBucket, this.processedBucket];

			for (const bucket of buckets) {
				const exists = await this.minioClient.bucketExists(bucket);
				if (!exists) {
					await this.minioClient.makeBucket(bucket, 'us-east-1');
					this.logger.log(`Created bucket: ${bucket}`);
				}
			}
		} catch (error) {
			this.logger.error(`Error ensuring buckets exist: ${error.message}`, error.stack);
			throw error;
		}
	}

	async generatePresignedUploadUrl(
		bucket: string,
		key: string,
		expiresInSeconds: number = 3600,
	): Promise<string> {
		try {
			const url = await this.minioClient.presignedPutObject(bucket, key, expiresInSeconds);
			return url;
		} catch (error) {
			this.logger.error(`Error generating presigned upload URL: ${error.message}`, error.stack);
			throw error;
		}
	}

	async generatePresignedDownloadUrl(
		bucket: string,
		key: string,
		expiresInSeconds: number = 3600,
	): Promise<string> {
		try {
			const url = await this.minioClient.presignedGetObject(bucket, key, expiresInSeconds);
			return url;
		} catch (error) {
			this.logger.error(`Error generating presigned download URL: ${error.message}`, error.stack);
			throw error;
		}
	}

	async getObject(bucket: string, key: string): Promise<NodeJS.ReadableStream> {
		try {
			return await this.minioClient.getObject(bucket, key);
		} catch (error) {
			this.logger.error(`Error getting object: ${error.message}`, error.stack);
			throw error;
		}
	}

	async putObject(
		bucket: string,
		key: string,
		data: Buffer | string | NodeJS.ReadableStream,
		size?: number,
		metaData?: Record<string, string | number>,
	): Promise<void> {
		try {
			if (typeof data === 'string') {
				const buffer = Buffer.from(data);
				await this.minioClient.putObject(bucket, key, buffer, buffer.length, metaData);
			} else if (data instanceof Buffer) {
				await this.minioClient.putObject(bucket, key, data, data.length, metaData);
			} else {
				if (!size) {
					throw new Error('Size is required for stream data');
				}
				await this.minioClient.putObject(bucket, key, data as any, size, metaData);
			}
		} catch (error) {
			this.logger.error(`Error putting object: ${error.message}`, error.stack);
			throw error;
		}
	}

	async deleteObject(bucket: string, key: string): Promise<void> {
		try {
			await this.minioClient.removeObject(bucket, key);
		} catch (error) {
			this.logger.error(`Error deleting object: ${error.message}`, error.stack);
			throw error;
		}
	}

	async objectExists(bucket: string, key: string): Promise<boolean> {
		try {
			await this.minioClient.statObject(bucket, key);
			return true;
		} catch (error) {
			if (error.code === 'NotFound') {
				return false;
			}
			throw error;
		}
	}

	async listObjects(
		bucket: string,
		prefix: string = '',
		recursive: boolean = true,
	): Promise<any[]> {
		return new Promise((resolve, reject) => {
			const objects: any[] = [];
			const stream = this.minioClient.listObjects(bucket, prefix, recursive);

			stream.on('data', (obj) => objects.push(obj));
			stream.on('end', () => resolve(objects));
			stream.on('error', (err) => reject(err));
		});
	}

	getUploadsBucket(): string {
		return this.uploadsBucket;
	}

	getProcessedBucket(): string {
		return this.processedBucket;
	}
}
