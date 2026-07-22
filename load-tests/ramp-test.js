import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
	stages: [
		{ duration: '2m', target: 10 },
		{ duration: '2m', target: 50 },
		{ duration: '2m', target: 100 },
		{ duration: '2m', target: 150 },
		{ duration: '2m', target: 200 },
		{ duration: '2m', target: 0 },
	],
	thresholds: {
		'http_req_duration': ['p(95)<1000'],
		'http_req_failed': ['rate<0.02'],
	},
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
	const payload = {
		fileName: `ramp-test-${__VU}-${__ITER}.txt`,
		mimeType: 'text/plain',
		size: 1024,
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
		'status is 200': (r) => r.status === 200,
	});

	sleep(1);
}
