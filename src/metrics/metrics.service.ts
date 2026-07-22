import { Injectable } from '@nestjs/common';
import { Counter, Histogram, Gauge } from 'prom-client';
import { InjectMetric } from '@willsoto/nestjs-prometheus';

/**
 * Service for custom application metrics
 */
@Injectable()
export class MetricsService {
	constructor(
		@InjectMetric('http_requests_total')
		public requestCounter: Counter<string>,

		@InjectMetric('http_request_duration_seconds')
		public requestDuration: Histogram<string>,

		@InjectMetric('file_uploads_total')
		public fileUploadsCounter: Counter<string>,

		@InjectMetric('file_processing_duration_seconds')
		public fileProcessingDuration: Histogram<string>,

		@InjectMetric('circuit_breaker_state')
		public circuitBreakerState: Gauge<string>,

		@InjectMetric('queue_depth')
		public queueDepth: Gauge<string>,

		@InjectMetric('cache_hits_total')
		public cacheHits: Counter<string>,

		@InjectMetric('cache_misses_total')
		public cacheMisses: Counter<string>,
	) {}

	/**
	 * Record an HTTP request
	 */
	recordRequest(method: string, route: string, statusCode: number, duration: number) {
		this.requestCounter.inc({
			method,
			route,
			status: statusCode.toString(),
		});

		this.requestDuration.observe(
			{
				method,
				route,
				status: statusCode.toString(),
			},
			duration / 1000, // Convert to seconds
		);
	}

	/**
	 * Record file upload
	 */
	recordFileUpload(status: 'success' | 'failure') {
		this.fileUploadsCounter.inc({ status });
	}

	/**
	 * Record file processing duration
	 */
	recordFileProcessing(duration: number, status: 'success' | 'failure') {
		this.fileProcessingDuration.observe({ status }, duration / 1000);
	}

	/**
	 * Update circuit breaker state
	 */
	updateCircuitBreakerState(service: string, state: number) {
		// 0 = closed, 1 = open, 2 = half-open
		this.circuitBreakerState.set({ service }, state);
	}

	/**
	 * Update queue depth
	 */
	updateQueueDepth(queue: string, depth: number) {
		this.queueDepth.set({ queue }, depth);
	}

	/**
	 * Record cache hit
	 */
	recordCacheHit(cache: string) {
		this.cacheHits.inc({ cache });
	}

	/**
	 * Record cache miss
	 */
	recordCacheMiss(cache: string) {
		this.cacheMisses.inc({ cache });
	}
}
