import { Controller, Get, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { AppService } from './app.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';

@Controller()
export class AppController {
	constructor(private readonly appService: AppService) {}

	@Get('health')
	getHealth(): { status: string; timestamp: string } {
		return {
			status: 'ok',
			timestamp: new Date().toISOString(),
		};
	}
}
