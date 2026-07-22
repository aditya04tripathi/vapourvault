import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrometheusController } from '@willsoto/nestjs-prometheus';

@ApiTags('metrics')
@Controller()
export class MetricsController extends PrometheusController {
	@Get('metrics')
	@ApiOperation({ summary: 'Get Prometheus metrics' })
	async index(response: any) {
		return super.index(response);
	}
}
