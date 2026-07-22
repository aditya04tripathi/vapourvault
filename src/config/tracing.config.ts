import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';

/**
 * Initialize OpenTelemetry tracing with Jaeger exporter
 */
export function initTracing() {
	const jaegerExporter = new JaegerExporter({
		endpoint: process.env.JAEGER_ENDPOINT || 'http://localhost:14268/api/traces',
		// Alternative: use agent endpoint
		// host: 'localhost',
		// port: 6832,
	});

	const sdk = new NodeSDK({
		serviceName: 'vaporvault-api',
		traceExporter: jaegerExporter,
		instrumentations: [
			getNodeAutoInstrumentations({
				'@opentelemetry/instrumentation-fs': {
					enabled: false, // Disable file system tracing (too verbose)
				},
				'@opentelemetry/instrumentation-http': {
					enabled: true,
				},
			}),
		],
	});

	sdk.start();

	// Graceful shutdown
	process.on('SIGTERM', () => {
		sdk
			.shutdown()
			.then(() => console.log('Tracing terminated'))
			.catch((error) => console.error('Error terminating tracing', error))
			.finally(() => process.exit(0));
	});

	console.log('OpenTelemetry tracing initialized with Jaeger');
}
