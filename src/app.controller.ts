import { Controller, Get, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { AppService } from './app.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';

/**
 * Controller for basic application health checks.
 */
@Controller()
export class AppController {
	constructor(private readonly appService: AppService) {}

	/**
	 * Health check endpoint.
	 * @returns Object containing status and timestamp.
	 */
	@Get('health')
	getHealth(): { status: string; timestamp: string } {
		return {
			status: 'ok',
			timestamp: new Date().toISOString(),
		};
	}
}
