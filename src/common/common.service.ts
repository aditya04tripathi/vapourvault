import { Injectable } from '@nestjs/common';

@Injectable()
export class CommonService {
	formatResponse(data: any, message?: string) {
		return {
			success: true,
			message,
			data,
		};
	}

	formatError(message: string, error?: any) {
		return {
			success: false,
			message,
			error,
		};
	}
}
