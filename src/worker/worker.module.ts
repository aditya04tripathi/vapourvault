import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { FileProcessor } from './worker.processor';
import { QueueModule } from 'src/queue/queue.module';
import { StorageModule } from 'src/storage/storage.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { pinoLoggerConfig } from 'src/config/logger.config';

@Module({
	imports: [
		ConfigModule.forRoot({ isGlobal: true }),
		LoggerModule.forRoot(pinoLoggerConfig),
		QueueModule,
		StorageModule,
		PrismaModule,
	],
	providers: [FileProcessor],
})
/**
 * Module for configuring background worker processors.
 */
export class WorkerModule {}
