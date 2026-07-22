import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
	private redis: Redis;

	constructor(private config: ConfigService) {
		super();
		const redisUrl = this.config.get<string>('REDIS_URL') || 'redis://localhost:6379';
		this.redis = new Redis(redisUrl);
	}

	async isHealthy(key: string): Promise<HealthIndicatorResult> {
		try {
			const pong = await this.redis.ping();
			if (pong === 'PONG') {
				return this.getStatus(key, true);
			}
			throw new Error('Redis ping failed');
		} catch (error) {
			throw new HealthCheckError('Redis health check failed', this.getStatus(key, false));
		}
	}
}
