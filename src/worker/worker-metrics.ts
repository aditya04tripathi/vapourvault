import { createServer } from "node:http";
import {
	Counter,
	Histogram,
	Registry,
	collectDefaultMetrics,
} from "prom-client";

const register = new Registry();
collectDefaultMetrics({ register });

export const workerJobsProcessedTotal = new Counter({
	name: "worker_jobs_processed_total",
	help: "Total worker jobs processed",
	labelNames: ["status"],
	registers: [register],
});

export const workerJobDurationSeconds = new Histogram({
	name: "worker_job_duration_seconds",
	help: "Worker job processing duration in seconds",
	labelNames: ["status"],
	buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60, 120],
	registers: [register],
});

export function recordWorkerJob(
	status: "success" | "failure",
	durationMs: number,
) {
	workerJobsProcessedTotal.inc({ status });
	workerJobDurationSeconds.observe({ status }, durationMs / 1000);
}

export function startWorkerMetricsServer() {
	const port = Number(process.env.PORT) || 3000;
	const host = process.env.HOST || "0.0.0.0";

	const server = createServer(async (req, res) => {
		const url = req.url ?? "/";

		if (url === "/metrics") {
			res.writeHead(200, { "Content-Type": register.contentType });
			res.end(await register.metrics());
			return;
		}

		if (url === "/health" || url === "/health/liveness") {
			res.writeHead(200, { "Content-Type": "application/json" });
			res.end(JSON.stringify({ ok: true }));
			return;
		}

		res.writeHead(404);
		res.end();
	});

	server.listen(port, host);
}

export { register };
