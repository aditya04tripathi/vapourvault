import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { StorageModule } from 'src/storage/storage.module';
import { QueueModule } from 'src/queue/queue.module';
import { PrismaHealthIndicator } from './indicators/prisma.health';
import { RedisHealthIndicator } from './indicators/redis.health';
import { MinioHealthIndicator } from './indicators/minio.health';

@Module({
	imports: [TerminusModule, PrismaModule, StorageModule, QueueModule],
	controllers: [HealthController],
	providers: [PrismaHealthIndicator, RedisHealthIndicator, MinioHealthIndicator],
})
export class HealthModule {}
