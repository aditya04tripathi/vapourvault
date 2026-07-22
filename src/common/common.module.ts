import { Module } from '@nestjs/common';
import { CommonService } from 'src/common/common.service';
import { IdempotencyService } from './idempotency.service';

@Module({
	providers: [CommonService, IdempotencyService],
	exports: [CommonService, IdempotencyService],
})
export class CommonModule {}
