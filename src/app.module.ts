import { Module } from '@nestjs/common';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from 'src/app.controller';
import { AppService } from 'src/app.service';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from 'src/prisma/prisma.module';
import { FileModule } from 'src/file/file.module';
import { StorageModule } from 'src/storage/storage.module';
import { QueueModule } from 'src/queue/queue.module';
import { WorkerModule } from 'src/worker/worker.module';
import { ScheduleModule } from '@nestjs/schedule';
import { CleanupService } from 'src/tasks/cleanup.service';
import { GlobalExceptionFilter } from 'src/utils/filters';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
		}),
		ThrottlerModule.forRoot([
			{
				ttl: 60000,
				limit: 10,
			},
		]),
		PrismaModule,
		ScheduleModule.forRoot(),
		JwtModule.register({}),
		StorageModule,
		QueueModule,
		FileModule,
		WorkerModule,
	],
	controllers: [AppController],
	providers: [
		AppService,
		CleanupService,
		{
			provide: APP_GUARD,
			useClass: ThrottlerGuard,
		},
		{
			provide: APP_FILTER,
			useClass: GlobalExceptionFilter,
		},
	],
})
/**
 * Root module of the application.
 * Configures global imports, providers, and controllers.
 */
export class AppModule {}
