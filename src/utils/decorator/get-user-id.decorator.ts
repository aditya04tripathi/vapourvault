import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetUserId = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
	// Mock user ID for development since auth is removed
	return '123e4567-e89b-12d3-a456-426614174000';
});
