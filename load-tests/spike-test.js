import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
	stages: [
		{ duration: '10s', target: 10 },   // Normal load
		{ duration: '1m', target: 500 },   // Spike to 500 users
		{ duration: '10s', target: 10 },   // Drop back to normal
		{ duration: '10s', target: 0 },    // Ramp down
	],
	thresholds: {
		'http_req_duration': ['p(95)<2000'], // Allow higher latency during spike
		'http_req_failed': ['rate<0.05'],    // Allow 5% error rate during spike
	},
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
	const payload = {
		fileName: `spike-test-${__VU}-${__ITER}.txt`,
		mimeType: 'text/plain',
		size: 512,
	};

	const res = http.post(
		`${BASE_URL}/files/presign-upload`,
		JSON.stringify(payload),
		{
			headers: {
				'Content-Type': 'application/json',
			},
		}
	);

	check(res, {
		'status is 200 or 429': (r) => r.status === 200 || r.status === 429, // Allow rate limiting
	});

	sleep(0.5); // Faster requests to create spike
}
