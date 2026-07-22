import { Params } from 'nestjs-pino';

/**
 * Pino logger configuration for structured JSON logging.
 * Includes correlation ID and request ID in all logs.
 */
export const pinoLoggerConfig: Params = {
	pinoHttp: {
		level: process.env.LOG_LEVEL || 'info',
		transport:
			process.env.NODE_ENV !== 'production'
				? {
						target: 'pino-pretty',
						options: {
							colorize: true,
							levelFirst: true,
							translateTime: 'yyyy-mm-dd HH:MM:ss.l o',
							ignore: 'pid,hostname',
							singleLine: false,
							messageFormat: '{req.method} {req.url} | {msg}',
						},
					}
				: undefined,
		customProps: (req: any) => ({
			correlationId: req.correlationId,
			requestId: req.requestId,
			userId: req.user?.id || 'anonymous',
		}),
		redact: {
			paths: [
				'req.headers.authorization',
				'req.headers.cookie',
				'res.headers["set-cookie"]',
				'*.password',
				'*.token',
				'*.secret',
			],
			remove: true,
		},
		serializers: {
			req: (req: any) => ({
				id: req.id,
				method: req.method,
				url: req.url,
				query: req.query,
				params: req.params,
				correlationId: req.raw?.correlationId,
				requestId: req.raw?.requestId,
			}),
			res: (res: any) => ({
				statusCode: res.statusCode,
			}),
		},
		autoLogging: {
			ignore: (req: any) => {
				// Don't log health checks and metrics endpoints
				return req.url === '/health' || req.url === '/metrics';
			},
		},
	},
};
