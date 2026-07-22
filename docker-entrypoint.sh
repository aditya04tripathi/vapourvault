#!/bin/sh
set -e

echo "ENTRYPOINT: checking migration flag"
if [ "${RUN_MIGRATIONS:-false}" = "true" ]; then
  echo "RUN_MIGRATIONS=true — attempting database migrations..."
  if [ -n "$DATABASE_URL" ]; then
    echo "DATABASE_URL is set"
    # Pass explicit config and schema paths so Prisma CLI can find them inside the container
    npx prisma migrate deploy --config prisma.config.ts --schema prisma/schema.prisma
  else
    echo "ERROR: DATABASE_URL is not set"
    exit 1
  fi
else
  echo "RUN_MIGRATIONS != true — skipping database migrations"
fi

echo "Starting application..."
exec "$@"
