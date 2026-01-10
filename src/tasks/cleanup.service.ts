import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/prisma/prisma.service';
import { StorageService } from 'src/storage/storage.service';

@Injectable()
export class CleanupService {
	private readonly logger = new Logger(CleanupService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly storage: StorageService,
	) {}

	@Cron(CronExpression.EVERY_HOUR)
	async handleCleanup() {
		this.logger.log('Running scheduled cleanup of expired files...');

		const expiryTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

		try {
			// Find expired files
			const expiredFiles = await this.prisma.file.findMany({
				where: {
					createdAt: {
						lt: expiryTime,
					},
				},
			});

			this.logger.log(`Found ${expiredFiles.length} expired files to delete.`);

			for (const file of expiredFiles) {
				try {
					// Delete from MinIO
					await this.storage.deleteObject(file.uploadBucket, file.uploadKey);
					if (file.processedKey && file.processedBucket) {
						await this.storage.deleteObject(file.processedBucket, file.processedKey);
					}

					// Delete from Database
					await this.prisma.file.delete({
						where: { id: file.id },
					});

					this.logger.log(`Deleted expired file: ${file.id}`);
				} catch (err) {
					this.logger.error(`Failed to delete file ${file.id}: ${err.message}`);
				}
			}
		} catch (error) {
			this.logger.error(`Error during cleanup execution: ${error.message}`);
		}
	}
}
