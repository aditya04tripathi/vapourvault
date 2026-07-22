import {
	makeCounterProvider,
	makeHistogramProvider,
	makeGaugeProvider,
} from '@willsoto/nestjs-prometheus';

export const metricsProviders = [
	makeCounterProvider({
		name: 'http_requests_total',
		help: 'Total number of HTTP requests',
		labelNames: ['method', 'route', 'status'],
	}),
	makeHistogramProvider({
		name: 'http_request_duration_seconds',
		help: 'HTTP request duration in seconds',
		labelNames: ['method', 'route', 'status'],
		buckets: [0.01, 0.05, 0.1, 0.2, 0.5, 1, 2, 5],
	}),
	makeCounterProvider({
		name: 'file_uploads_total',
		help: 'Total number of file uploads',
		labelNames: ['status'],
	}),
	makeHistogramProvider({
		name: 'file_processing_duration_seconds',
		help: 'File processing duration in seconds',
		labelNames: ['status'],
		buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60],
	}),
	makeGaugeProvider({
		name: 'circuit_breaker_state',
		help: 'Circuit breaker state (0=closed, 1=open, 2=half-open)',
		labelNames: ['service'],
	}),
	makeGaugeProvider({
		name: 'queue_depth',
		help: 'Number of pending jobs in queue',
		labelNames: ['queue'],
	}),
	makeCounterProvider({
		name: 'cache_hits_total',
		help: 'Total number of cache hits',
		labelNames: ['cache'],
	}),
	makeCounterProvider({
		name: 'cache_misses_total',
		help: 'Total number of cache misses',
		labelNames: ['cache'],
	}),
];
