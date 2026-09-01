import {
	Injectable,
	NestInterceptor,
	ExecutionContext,
	CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { Request, Response } from "express";
import { MetricsService } from "./metrics.service";
import { shouldSkipRoute } from "./metrics.util";

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
	constructor(private readonly metricsService: MetricsService) {}

	intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
		const http = context.switchToHttp();
		const req = http.getRequest<Request>();
		const res = http.getResponse<Response>();
		const start = Date.now();
		const route = req.route?.path ?? req.path ?? "unknown";

		if (shouldSkipRoute(route)) {
			return next.handle();
		}

		return next.handle().pipe(
			tap({
				finalize: () => {
					this.metricsService.recordRequest(
						req.method,
						route,
						res.statusCode,
						Date.now() - start,
					);
				},
			}),
		);
	}
}
