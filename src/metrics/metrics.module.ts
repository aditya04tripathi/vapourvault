import { Module } from '@nestjs/common';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';
import { metricsProviders } from './metrics.providers';

@Module({
	imports: [
		PrometheusModule.register({
			defaultMetrics: {
				enabled: true,
			},
			path: '/metrics',
			defaultLabels: {
				app: 'vaporvault',
			},
		}),
	],
	controllers: [MetricsController],
	providers: [MetricsService, ...metricsProviders],
	exports: [MetricsService],
})
export class MetricsModule {}
