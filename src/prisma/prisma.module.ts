import { Global, Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Global()
@Module({
	providers: [PrismaService],
	exports: [PrismaService],
})
/**
 * Global module for database services.
 */
export class PrismaModule {}
