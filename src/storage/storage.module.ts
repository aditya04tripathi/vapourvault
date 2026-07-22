import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StorageService } from './storage.service';

@Global()
@Module({
	imports: [ConfigModule],
	providers: [StorageService],
	exports: [StorageService],
})
/**
 * Global module for storage services.
 */
export class StorageModule {}
