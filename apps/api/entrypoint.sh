#!/bin/sh
set -e

cd /app

if [ -z "$DATABASE_URL" ]; then
  echo "DATABASE_URL is required"
  exit 1
fi

echo "Applying Prisma schema (db push)..."
pnpm --filter @chat-with-ancients/db run db:push

echo "Seeding database (idempotent upserts)..."
pnpm --filter @chat-with-ancients/db run db:seed

echo "Starting API..."
exec pnpm --filter @chat-with-ancients/api start
