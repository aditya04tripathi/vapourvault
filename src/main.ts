import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Bootstrap the NestJS application.
 * Configures CORS, global validation pipes, Swagger documentation, and starts the server.
 */
async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	const configService = app.get(ConfigService);

	app.enableCors({
		origin: configService.get('CORS_ORIGIN') || 'http://localhost:3000',
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
		.setTitle('Anonymous File Storage API')
		.setDescription('API documentation for the Anonymous File Storage Service')
		.setVersion('1.0.0')
		.build();

	const documentFactory = () => SwaggerModule.createDocument(app, config);
	SwaggerModule.setup('api', app, documentFactory);

	const port = configService.get('PORT') || 3000;
	await app.listen(port);
	console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
