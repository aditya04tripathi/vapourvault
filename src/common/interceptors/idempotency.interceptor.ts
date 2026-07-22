import {
	Injectable,
	NestInterceptor,
	ExecutionContext,
	CallHandler,
	ConflictException,
	Logger,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { IdempotencyService } from '../idempotency.service';

/**
 * Interceptor to handle idempotent requests.
 * Checks if a request with the same ID has been processed before.
 * If yes, returns cached response. If no, processes and caches the response.
 */
@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
	private readonly logger = new Logger(IdempotencyInterceptor.name);

	constructor(private readonly idempotencyService: IdempotencyService) {}

	async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
		const request = context.switchToHttp().getRequest();
		const requestId = request.requestId;

		if (!requestId) {
			// If no request ID, proceed without idempotency check
			return next.handle();
		}

		// Check for cached response
		const cachedResponse = await this.idempotencyService.getCachedResponse(requestId);
		if (cachedResponse) {
			this.logger.log(`Returning cached response for request: ${requestId}`);
			return of(cachedResponse);
		}

		// Try to acquire processing lock
		const lockAcquired = await this.idempotencyService.acquireProcessingLock(requestId);
		if (!lockAcquired) {
			// Request is currently being processed by another instance
			throw new ConflictException(
				'Request is currently being processed. Please retry after a few seconds.',
			);
		}

		// Process the request and cache the response
		return next.handle().pipe(
			tap(async (response) => {
				// Cache the response
				await this.idempotencyService.cacheResponse(requestId, response);
				// Release the processing lock
				await this.idempotencyService.releaseProcessingLock(requestId);
			}),
		);
	}
}
