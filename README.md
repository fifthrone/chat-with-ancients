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

## Phase 3 local API + mobile flow

1. Ensure root `.env` has these values (or copy from `.env.example`):
   - `DATABASE_URL=...`
   - `PORT=4000`
2. Create mobile env file:
   - `cp apps/mobile/.env.example apps/mobile/.env`
   - Set `EXPO_PUBLIC_API_URL=http://localhost:4000` (or your LAN IP on device)
3. Start MySQL and seed data:
   - `pnpm db:up`
   - `pnpm db:push`
   - `pnpm db:seed`
4. Start API:
   - `pnpm dev:api`
5. In another terminal, start mobile:
   - `pnpm dev:mobile`

For physical devices, replace `EXPO_PUBLIC_API_URL` with your machine LAN IP, e.g.
`http://192.168.1.10:4000`.

## Troubleshooting

- If `db:push` fails with connection errors, verify `.env` exists and MySQL is healthy (`pnpm db:up`).
- If Docker port `3306` is occupied, set `MYSQL_PORT` in `.env` and update `DATABASE_URL` to match.
