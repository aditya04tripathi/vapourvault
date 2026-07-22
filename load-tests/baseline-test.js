import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const uploadDuration = new Trend('upload_duration');
const downloadDuration = new Trend('download_duration');

export const options = {
	stages: [
		{ duration: '2m', target: 50 }, // Ramp up to 50 users
		{ duration: '5m', target: 50 }, // Stay at 50 users for 5 minutes
		{ duration: '2m', target: 0 },  // Ramp down to 0 users
	],
	thresholds: {
		'http_req_duration': ['p(95)<500', 'p(99)<1000'], // 95% < 500ms, 99% < 1s
		'errors': ['rate<0.01'], // Error rate < 1%
		'http_req_failed': ['rate<0.01'],
	},
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
	// Test 1: Upload file
	const uploadPayload = {
		fileName: `test-file-${__VU}-${__ITER}.txt`,
		mimeType: 'text/plain',
		size: 1024,
	};

	const uploadStart = Date.now();
	const uploadRes = http.post(
		`${BASE_URL}/files/presign-upload`,
		JSON.stringify(uploadPayload),
		{
			headers: {
				'Content-Type': 'application/json',
				'x-correlation-id': `test-${__VU}-${__ITER}`,
			},
		}
	);

	uploadDuration.add(Date.now() - uploadStart);

	const uploadSuccess = check(uploadRes, {
		'upload presign status is 200': (r) => r.status === 200,
		'upload presign has fileId': (r) => JSON.parse(r.body).fileId !== undefined,
	});

	errorRate.add(!uploadSuccess);

	if (uploadSuccess) {
		const { fileId } = JSON.parse(uploadRes.body);

		// Test 2: Check file status
		sleep(1);
		const statusRes = http.get(`${BASE_URL}/files/${fileId}/status`, {
			headers: {
				'x-correlation-id': `test-${__VU}-${__ITER}`,
			},
		});

		check(statusRes, {
			'status check is 200': (r) => r.status === 200,
		});

		// Test 3: Check health endpoint
		const healthRes = http.get(`${BASE_URL}/health`);
		check(healthRes, {
			'health check is 200': (r) => r.status === 200,
		});
	}

	sleep(1);
}
