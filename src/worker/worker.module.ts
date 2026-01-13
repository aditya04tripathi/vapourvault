import { Module } from '@nestjs/common';
import { FileProcessor } from './worker.processor';
import { QueueModule } from 'src/queue/queue.module';
import { StorageModule } from 'src/storage/storage.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
	imports: [QueueModule, StorageModule, PrismaModule],
	providers: [FileProcessor],
})
/**
 * Module for configuring background worker processors.
 */
export class WorkerModule {}
