# VaporVault Load Testing Guide

## Overview

This directory contains k6 load test scripts for validating VaporVault's performance and resilience under various traffic patterns.

## Prerequisites

Install k6:
```bash
# macOS
brew install k6

# Linux
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Windows (via Chocolatey)
choco install k6
```

## Test Scenarios

### 1. Baseline Test (`baseline-test.js`)
**Purpose:** Establish performance baseline under normal load  
**Load Pattern:** 50 concurrent users for 5 minutes  
**Thresholds:**
- P95 latency < 500ms
- P99 latency < 1000ms
- Error rate < 1%

**Run:**
```bash
k6 run load-tests/baseline-test.js
```

### 2. Sustained Load Test (`sustained-load-test.js`)
**Purpose:** Verify system stability under sustained high load  
**Load Pattern:** 100 concurrent users for 10 minutes  
**Thresholds:**
- P95 latency < 1000ms
- P99 latency < 2000ms
- Error rate < 2%

**Run:**
```bash
k6 run load-tests/sustained-load-test.js
```

### 3. Spike Test (`spike-test.js`)
**Purpose:** Test system behavior during sudden traffic spikes  
**Load Pattern:** 10 → 500 → 10 users over 1.5 minutes  
**Thresholds:**
- P95 latency < 2000ms (relaxed during spike)
- Error rate < 5% (allows rate limiting)

**Run:**
```bash
k6 run load-tests/spike-test.js
```

### 4. Ramp Test (`ramp-test.js`)
**Purpose:** Identify breaking point and scalability limits  
**Load Pattern:** Gradual increase from 10 → 200 users over 12 minutes  
**Thresholds:**
- P95 latency < 1000ms
- Error rate < 2%

**Run:**
```bash
k6 run load-tests/ramp-test.js
```

## Running Against Custom Endpoints

Set the `BASE_URL` environment variable:
```bash
k6 run -e BASE_URL=http://production.example.com load-tests/baseline-test.js
```

## Interpreting Results

### Key Metrics
- **http_req_duration**: Request latency (includes p95, p99)
- **http_req_failed**: Failed request rate
- **http_reqs**: Total requests per second
- **vus**: Virtual users (concurrent connections)

### Success Criteria
✅ **Pass:** All thresholds met, system stable  
⚠️ **Warning:** Approaching thresholds, investigate  
❌ **Fail:** Thresholds exceeded, optimization needed

## Monitoring During Tests

While running tests, monitor:
1. Grafana dashboard: http://localhost:3001
2. Prometheus metrics: http://localhost:9090
3. Jaeger traces: http://localhost:16686
4. Application logs: `docker-compose logs -f api worker`

## Best Practices

1. **Warm-up period:** Let system stabilize before measuring
2. **Isolated environment:** Run tests in staging, not production
3. **Multiple runs:** Execute each test 3 times for consistency
4. **Resource monitoring:** Watch CPU, memory, disk, network
5. **Baseline first:** Always run baseline before advanced tests

## Example Output

```
✓ upload presign status is 200
✓ upload presign has fileId
✓ status check is 200
✓ health check is 200

checks.........................: 100.00% ✓ 12000      ✗ 0
data_received..................: 3.2 MB  53 kB/s
data_sent......................: 2.1 MB  35 kB/s
http_req_duration..............: avg=145ms min=42ms med=128ms max=892ms p(95)=312ms p(99)=456ms
http_reqs......................: 3000    50/s
vus............................: 50      min=0  max=50
```

## Troubleshooting

**High error rate:**
- Check circuit breaker state (Grafana)
- Review error logs
- Verify infrastructure resources

**Slow response times:**
- Check queue depth (Redis metrics)
- Review database query performance
- Analyze distributed traces (Jaeger)

**Connection timeouts:**
- Increase k6 timeout: `http.setResponseCallback(...)`
- Check network limits
- Verify service health endpoints
