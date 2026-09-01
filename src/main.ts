import { NestFactory } from "@nestjs/core";
import {
	SwaggerModule,
	DocumentBuilder,
	SwaggerCustomOptions,
} from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SwaggerTheme, SwaggerThemeNameEnum } from "swagger-themes";
import { Logger } from "nestjs-pino";
import { CorrelationIdMiddleware } from "./common/middleware/correlation-id.middleware";
import { initTracing } from "./config/tracing.config";

// Initialize tracing before application starts
if (process.env.ENABLE_TRACING === "true") {
	initTracing(process.env.OTEL_SERVICE_NAME ?? "vapourvault-api");
}

/**
 * Bootstrap the NestJS application.
 * Configures CORS, global validation pipes, Swagger documentation, and starts the server.
 */
async function bootstrap() {
	const app = await NestFactory.create(AppModule, { bufferLogs: true });

	// Use Pino logger for structured logging
	app.useLogger(app.get(Logger));

	const configService = app.get(ConfigService);

	// Apply correlation ID middleware globally
	const correlationIdMiddleware = new CorrelationIdMiddleware();
	app.use(correlationIdMiddleware.use.bind(correlationIdMiddleware));

	app.enableCors({
		origin: configService.get("CORS_ORIGIN") || "http://localhost:3000",
		credentials: true,
	});

	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			forbidNonWhitelisted: true,
			transform: true,
		}),
	);

	const config = new DocumentBuilder()
		.setTitle("VapourVault")
		.setDescription(
			'VaporVault is a robust, enterprise-grade backend service designed for secure, temporary file sharing. It completely eliminates the friction of user accounts, providing a seamless "drop and share" experience while ensuring digital hygiene through automated data purging.',
		)
		.setVersion("1.0.0")
		.build();

	const theme = new SwaggerTheme();
	const darkThemeCss = theme.getBuffer(SwaggerThemeNameEnum.DARK);

	const customOptions: SwaggerCustomOptions = {
		customCss: darkThemeCss,
		customSiteTitle: "Swagger Dark Mode",
		swaggerOptions: {
			docExpansion: "none",
			apisSorter: "alpha",
		},
	};

	const documentFactory = () => SwaggerModule.createDocument(app, config);
	SwaggerModule.setup("api", app, documentFactory, customOptions);

	const port = configService.get("PORT") || 3000;
	const host = configService.get("HOST") || "0.0.0.0";
	await app.listen(port, host);

	const logger = app.get(Logger);
	logger.log(`Application is running on: http://${host}:${port}`);
}
bootstrap();
