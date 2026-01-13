import { Module, Global } from '@nestjs/common';
import { StorageService } from './storage.service';

@Global()
@Module({
	providers: [StorageService],
	exports: [StorageService],
})
/**
 * Global module for storage services.
 */
export class StorageModule {}
