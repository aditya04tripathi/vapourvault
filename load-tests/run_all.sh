#!/usr/bin/env bash
set -euo pipefail

# Consolidated k6 runner for VaporVault load-tests
# - Runs baseline first, then sustained, spike, ramp
# - Performs a warm-up wait before each measured run
# - Executes each test 3 times
# - Collects k6 JSON outputs and docker stats resource monitoring
# - Requires STAGING=true to avoid accidental production runs

# Configuration
BASE_DIR="$(cd "$(dirname "$0")" && pwd)"
TEST_DIR="$BASE_DIR"
OUT_DIR="$BASE_DIR/results"
MONITOR_DIR="$OUT_DIR/monitor"
WARMUP_SECONDS=${WARMUP_SECONDS:-60}         # warm-up wait before measured run
REPEAT=3                                     # number of measured runs per test
MONITOR_INTERVAL=5                           # seconds between docker stats samples
K6_BIN="k6"

# Default target
BASE_URL="${BASE_URL:-http://localhost:3000}"

# Tests order (baseline first)
TESTS=(
  "baseline-test.js"
  "sustained-load-test.js"
  "spike-test.js"
  "ramp-test.js"
)

# Allow overriding tests by passing filenames as arguments
if [ "$#" -gt 0 ]; then
  TESTS=("$@")
fi

# Safety: require STAGING=true to run
if [ "${STAGING:-false}" != "true" ]; then
  echo "ERROR: This script must be run in an isolated/staging environment."
  echo "Set environment variable STAGING=true to proceed. Example: STAGING=true ./run_all.sh"
  exit 1
fi

mkdir -p "$OUT_DIR"
mkdir -p "$MONITOR_DIR"

# Start docker stats monitor (background)
MONITOR_PID_FILE="$MONITOR_DIR/monitor.pid"
function start_monitor() {
  echo "Starting resource monitor (docker stats) -> $MONITOR_DIR/docker-stats.log"
  docker_stats_loop() {
    while true; do
      # Use portable date format (UTC ISO 8601) for macOS compatibility
      echo "--- $(date -u +%Y-%m-%dT%H:%M:%SZ) ---" >> "$MONITOR_DIR/docker-stats.log"
      # list services from docker-compose labels (fallback to common names)
      docker stats --no-stream --format "{{.Name}} {{.CPUPerc}} {{.MemUsage}} {{.NetIO}} {{.BlockIO}}" >> "$MONITOR_DIR/docker-stats.log" 2>&1 || true
      sleep $MONITOR_INTERVAL
    done
  }
  docker_stats_loop &
  echo $! > "$MONITOR_PID_FILE"
}

function stop_monitor() {
  if [ -f "$MONITOR_PID_FILE" ]; then
    MON_PID=$(cat "$MONITOR_PID_FILE")
    echo "Stopping monitor (pid=$MON_PID)"
    kill "$MON_PID" 2>/dev/null || true
    rm -f "$MONITOR_PID_FILE"
  fi
}

trap 'stop_monitor; echo "Aborted."; exit 1' INT TERM

start_monitor

echo "Using BASE_URL=$BASE_URL"

for test in "${TESTS[@]}"; do
  script_path="$TEST_DIR/$test"
  if [ ! -f "$script_path" ]; then
    echo "Skipping missing test: $script_path"
    continue
  fi

  # Basename for output
  test_name="$(basename "$test" .js)"
  test_dir="$OUT_DIR/$test_name-$(date +%Y%m%d-%H%M%S)"
  mkdir -p "$test_dir"

  echo "=== Test: $test_name ==="
  echo "Warm-up: waiting $WARMUP_SECONDS seconds to allow system to stabilize..."
  sleep "$WARMUP_SECONDS"

  for i in $(seq 1 $REPEAT); do
    echo "Run $i/$REPEAT for $test_name"
    ts="$(date +%Y%m%d-%H%M%S)"
    out_json="$test_dir/${test_name}-run${i}-$ts.json"
    out_log="$test_dir/${test_name}-run${i}-$ts.log"

    # Run k6 and persist JSON summary
    echo "Running: $K6_BIN run $script_path -e BASE_URL=$BASE_URL --out json=$out_json"
    if $K6_BIN run "$script_path" -e BASE_URL="$BASE_URL" --out json="$out_json" > "$out_log" 2>&1; then
      echo "Run $i succeeded: $out_json"
    else
      echo "Run $i FAILED: see $out_log"
    fi

    # short cooldown between runs
    sleep 10
  done

  echo "Finished test: $test_name. Results in $test_dir"
done

stop_monitor

echo "All tests finished. Results directory: $OUT_DIR"

echo "Tip: to aggregate k6 JSON results use 'k6 report' or jq to parse the summaries."

exit 0
