import { NestFactory } from "@nestjs/core";
import { WorkerModule } from "./worker/worker.module";
import { Logger } from "nestjs-pino";
import { initTracing } from "./config/tracing.config";

// Initialize tracing before worker starts
if (process.env.ENABLE_TRACING === "true") {
	initTracing(process.env.OTEL_SERVICE_NAME ?? "vapourvault-worker");
}

async function bootstrap() {
	const app = await NestFactory.createApplicationContext(WorkerModule, {
		bufferLogs: true,
	});
	app.useLogger(app.get(Logger));

	const logger = app.get(Logger);
	logger.log("Worker service started");
}

bootstrap();
