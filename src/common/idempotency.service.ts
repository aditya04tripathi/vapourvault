import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/**
 * Service for managing idempotency keys to prevent duplicate request processing.
 * Uses Redis to store request IDs and cached responses with 24-hour TTL.
 */
@Injectable()
export class IdempotencyService {
	private readonly logger = new Logger(IdempotencyService.name);
	private readonly redis: Redis;
	private readonly ttl = 86400; // 24 hours in seconds

	constructor(private config: ConfigService) {
		const redisUrl = this.config.get<string>('REDIS_URL') || 'redis://localhost:6379';
		this.redis = new Redis(redisUrl);

		this.redis.on('error', (err) => {
			this.logger.error('Redis connection error:', err);
		});

		this.redis.on('connect', () => {
			this.logger.log('Redis connected for idempotency');
		});
	}

	/**
	 * Get cached response for a request ID if it exists
	 * @param requestId - Unique request identifier
	 * @returns Cached response object or null
	 */
	async getCachedResponse(requestId: string): Promise<any | null> {
		try {
			const cached = await this.redis.get(`idempotency:${requestId}`);
			if (cached) {
				this.logger.log(`Idempotency hit for request: ${requestId}`);
				return JSON.parse(cached);
			}
			return null;
		} catch (error) {
			this.logger.error(`Error getting cached response: ${error.message}`);
			return null;
		}
	}

	/**
	 * Cache a response for a request ID
	 * @param requestId - Unique request identifier
	 * @param response - Response object to cache
	 */
	async cacheResponse(requestId: string, response: any): Promise<void> {
		try {
			await this.redis.setex(
				`idempotency:${requestId}`,
				this.ttl,
				JSON.stringify({
					...response,
					cachedAt: new Date().toISOString(),
				}),
			);
			this.logger.log(`Cached response for request: ${requestId}`);
		} catch (error) {
			this.logger.error(`Error caching response: ${error.message}`);
		}
	}

	/**
	 * Check if a request is currently being processed (via distributed lock)
	 * @param requestId - Unique request identifier
	 * @returns true if lock acquired, false if already processing
	 */
	async acquireProcessingLock(requestId: string): Promise<boolean> {
		try {
			// SETNX: Set if not exists - atomic operation
			const lockKey = `processing:${requestId}`;
			const acquired = await this.redis.set(lockKey, '1', 'EX', 300, 'NX'); // 5 min timeout
			return acquired === 'OK';
		} catch (error) {
			this.logger.error(`Error acquiring processing lock: ${error.message}`);
			return false;
		}
	}

	/**
	 * Release processing lock for a request
	 * @param requestId - Unique request identifier
	 */
	async releaseProcessingLock(requestId: string): Promise<void> {
		try {
			await this.redis.del(`processing:${requestId}`);
		} catch (error) {
			this.logger.error(`Error releasing processing lock: ${error.message}`);
		}
	}

	async onModuleDestroy() {
		await this.redis.quit();
	}
}
