import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QueueService } from './queue.service';

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
				};
			},
			inject: [ConfigService],
		}),
		BullModule.registerQueue({
			name: 'file-processing',
		}),
	],
	providers: [QueueService],
	exports: [BullModule, QueueService],
})
export class QueueModule {}
