import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/prisma/prisma.service';
import { StorageService } from 'src/storage/storage.service';

/**
 * Service responsible for periodic cleanup of expired files.
 */
@Injectable()
export class CleanupService {
	private readonly logger = new Logger(CleanupService.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly storage: StorageService,
	) {}

	/**
	 * Cron job that runs every hour to delete files older than 24 hours.
	 * Removes data from both MinIO storage and PostgreSQL database.
	 */
	@Cron(CronExpression.EVERY_HOUR)
	async handleCleanup() {
		this.logger.log('Running scheduled cleanup of expired files...');

		const expiryTime = new Date(Date.now() - 24 * 60 * 60 * 1000);

		try {
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
					await this.storage.deleteObject(file.uploadBucket, file.uploadKey);
					if (file.processedKey && file.processedBucket) {
						await this.storage.deleteObject(file.processedBucket, file.processedKey);
					}

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
