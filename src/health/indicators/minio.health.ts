import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { StorageService } from 'src/storage/storage.service';

@Injectable()
export class MinioHealthIndicator extends HealthIndicator {
	constructor(private storageService: StorageService) {
		super();
	}

	async isHealthy(key: string): Promise<HealthIndicatorResult> {
		try {
			// Try to check if uploads bucket exists
			const bucket = this.storageService.getUploadsBucket();
			await this.storageService['minioClient'].bucketExists(bucket);
			return this.getStatus(key, true);
		} catch (error) {
			throw new HealthCheckError('MinIO health check failed', this.getStatus(key, false));
		}
	}
}
