import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import {
	HealthCheckService,
	HealthCheck,
	MemoryHealthIndicator,
	DiskHealthIndicator,
} from '@nestjs/terminus';
import { PrismaHealthIndicator } from './indicators/prisma.health';
import { RedisHealthIndicator } from './indicators/redis.health';
import { MinioHealthIndicator } from './indicators/minio.health';

@ApiTags('health')
@Controller('health')
export class HealthController {
	constructor(
		private health: HealthCheckService,
		private memory: MemoryHealthIndicator,
		private disk: DiskHealthIndicator,
		private prisma: PrismaHealthIndicator,
		private redis: RedisHealthIndicator,
		private minio: MinioHealthIndicator,
	) {}

	@Get()
	@HealthCheck()
	@ApiOperation({ summary: 'Health check for all services' })
	check() {
		return this.health.check([
			() => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024), // 150MB
			() => this.memory.checkRSS('memory_rss', 300 * 1024 * 1024), // 300MB
			() => this.disk.checkStorage('disk', { path: '/', thresholdPercent: 0.9 }),
			() => this.prisma.isHealthy('database'),
			() => this.redis.isHealthy('redis'),
			() => this.minio.isHealthy('storage'),
		]);
	}

	@Get('liveness')
	@HealthCheck()
	@ApiOperation({ summary: 'Liveness probe - is the app running' })
	liveness() {
		return this.health.check([() => this.memory.checkHeap('memory_heap', 200 * 1024 * 1024)]);
	}

	@Get('readiness')
	@HealthCheck()
	@ApiOperation({ summary: 'Readiness probe - can the app serve traffic' })
	readiness() {
		return this.health.check([
			() => this.prisma.isHealthy('database'),
			() => this.redis.isHealthy('redis'),
			() => this.minio.isHealthy('storage'),
		]);
	}
}
