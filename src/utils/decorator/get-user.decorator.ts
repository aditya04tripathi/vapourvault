import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetUser = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
	// Mock user for development since auth is removed
	const mockUser = {
		id: '123e4567-e89b-12d3-a456-426614174000',
		email: 'test@example.com',
		name: 'Test User',
	};
	return mockUser;
});
