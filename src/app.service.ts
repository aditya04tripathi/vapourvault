import { Injectable } from '@nestjs/common';

/**
 * Basic application service.
 */
@Injectable()
export class AppService {
	/**
	 * Returns a hello world message.
	 * @returns Greeting string.
	 */
	getHello(): string {
		return 'Hello World!';
	}
}
