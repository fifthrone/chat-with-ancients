# Chat With Ancients

## Phase 2 local database setup

1. Copy env template:
   - `cp .env.example .env`
2. Start MySQL:
   - `pnpm db:up`
3. Install workspace dependencies (if needed):
   - `pnpm install`
4. Push Prisma schema:
   - `pnpm db:push`
5. Seed ancients:
   - `pnpm db:seed`
6. Open Prisma Studio:
   - `pnpm db:studio`

Expected seeded slugs:
- `confucius`
- `socrates`
- `cleopatra`

## Helpful commands

- Stop database: `pnpm db:down`
- Regenerate Prisma client: `pnpm --filter @chat-with-ancients/db db:generate`
- Create migration: `pnpm db:migrate`

## Troubleshooting

- If `db:push` fails with connection errors, verify `.env` exists and MySQL is healthy (`pnpm db:up`).
- If Docker port `3306` is occupied, set `MYSQL_PORT` in `.env` and update `DATABASE_URL` to match.
