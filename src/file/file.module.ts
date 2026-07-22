import { Module } from '@nestjs/common';
import { FileController } from './file.controller';
import { FileService } from './file.service';
import { QueueModule } from 'src/queue/queue.module';
import { CommonModule } from 'src/common/common.module';

@Module({
	imports: [QueueModule, CommonModule],
	controllers: [FileController],
	providers: [FileService],
	exports: [FileService],
})
/**
 * Module managing file operations, including uploads, downloads, and status checks.
 */
export class FileModule {}
