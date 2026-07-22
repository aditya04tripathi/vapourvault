import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QueueService } from './queue.service';
import { JobRecoveryService } from './job-recovery.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
	imports: [
		BullModule.forRootAsync({
			imports: [ConfigModule],
			useFactory: async (configService: ConfigService) => {
				const redisUrl = configService.get<string>('REDIS_URL') || 'redis://localhost:6379';
				const url = new URL(redisUrl);

				return {
					connection: {
						host: url.hostname || 'localhost',
						port: parseInt(url.port || '6379', 10),
						password: url.password || undefined,
					},
					defaultJobOptions: {
						attempts: 3,
						backoff: {
							type: 'exponential',
							delay: 2000,
						},
						removeOnComplete: {
							age: 3600, // Keep completed jobs for 1 hour
							count: 1000,
						},
						removeOnFail: false, // Keep failed jobs in DLQ
					},
				};
			},
			inject: [ConfigService],
		}),
		BullModule.registerQueue({
			name: 'file-processing',
		}),
		PrismaModule,
	],
	providers: [QueueService, JobRecoveryService],
	exports: [BullModule, QueueService, JobRecoveryService],
})
/**
 * Module for configuring BullMQ queues.
 */
export class QueueModule {}
