import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export const CORRELATION_ID_HEADER = 'x-correlation-id';
export const REQUEST_ID_HEADER = 'x-request-id';

/**
 * Middleware to generate and propagate correlation IDs across requests.
 * Correlation IDs help trace a request through all services and logs.
 */
@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
	use(req: Request, res: Response, next: NextFunction) {
		// Extract or generate correlation ID
		const correlationId = (req.headers[CORRELATION_ID_HEADER] as string) || uuidv4();

		// Extract or generate request ID (for idempotency)
		const requestId = (req.headers[REQUEST_ID_HEADER] as string) || uuidv4();

		// Attach to request object for use in services
		req['correlationId'] = correlationId;
		req['requestId'] = requestId;

		// Add to response headers for client tracking
		res.setHeader(CORRELATION_ID_HEADER, correlationId);
		res.setHeader(REQUEST_ID_HEADER, requestId);

		next();
	}
}
