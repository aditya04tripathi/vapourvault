import { Module } from '@nestjs/common';
import { FileController } from './file.controller';
import { FileService } from './file.service';
import { QueueModule } from 'src/queue/queue.module';

@Module({
	imports: [QueueModule],
	controllers: [FileController],
	providers: [FileService],
	exports: [FileService],
})
export class FileModule {}
