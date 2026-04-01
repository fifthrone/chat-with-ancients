#!/bin/sh
set -e

cd /app

if [ -z "$DATABASE_URL" ]; then
  echo "DATABASE_URL is required"
  exit 1
fi

echo "Applying Prisma migrations (migrate deploy)..."
pnpm --filter @chat-with-ancients/db run db:migrate:deploy

if [ "${RUN_DB_SEED:-false}" = "true" ]; then
  echo "Seeding database (idempotent upserts)..."
  pnpm --filter @chat-with-ancients/db run db:seed
fi

echo "Starting API..."
exec pnpm --filter @chat-with-ancients/api start
