# Chat With Ancients

Chat With Ancients is a cross-platform, map-focused AI chat app where users explore places tied to historical figures and have guided conversations with them. It includes a mobile/web client, an API layer, and a database-backed content model for ancients, locations, chat history, and related app data.

## Tech stack

- **Expo + React Native** for the mobile-first app and shared cross-platform UI (including web builds).
- **TanStack** (TanStack Query/Router) for data fetching, cache management, and navigation.
- **Express** for the backend HTTP API and streaming chat.
- **Prisma + MySQL** for schema, migrations, type-safe queries, and seeding.
- **GitHub Actions** for CI (lint, tests, migration verification, Expo web export, Docker API image smoke build) and Pages deploy for web.

## Security & chat auth

- Chat routes (`GET /chat/conversation`, `POST /api/chat`) require `Authorization: Bearer <JWT>` issued by `POST /auth/chat-session` with body `{ "clientId": "<id>" }`. The JWT `sub` claim is the **only** trusted client identity for loading or continuing a conversation (no spoofing `clientId` via query/body).
- Set **`CHAT_SESSION_SECRET`** in `.env` (min **16** characters in development, min **32** in production). The API refuses to start in production with wildcard CORS or a weak secret.
- **`CORS_ORIGINS`**: comma-separated list. In development, if unset, common Expo localhost origins are assumed. In **production**, you must set explicit origins (no `*`).

## Phase 2 — Local database setup

1. Copy env template: `cp .env.example .env` and set **`CHAT_SESSION_SECRET`**, **`DATABASE_URL`**, **`GEMINI_API_KEY`**, and **`CORS_ORIGINS`** as needed.
2. Start MySQL: `pnpm db:up`
3. Install dependencies: `pnpm install`
4. Apply migrations: `pnpm db:migrate:deploy`  
   (For iterative schema work in dev, use `pnpm db:migrate` to create new migrations.)
5. Seed ancients: `pnpm db:seed`
6. Optional: `pnpm db:studio`

Expected seeded slugs (among others):

- `confucius`
- `socrates`
- `cleopatra`

## Helpful commands

| Command | Purpose |
| --- | --- |
| `pnpm db:down` | Stop Compose stack |
| `pnpm db:migrate` | Create/apply dev migrations (`prisma migrate dev`) |
| `pnpm db:migrate:deploy` | Apply committed migrations (`prisma migrate deploy`) — use in CI/prod |
| `pnpm db:seed` | Seed data (idempotent upserts) |
| `pnpm --filter @chat-with-ancients/db db:generate` | Regenerate Prisma Client |
| `pnpm lint` | Biome check (API + selected mobile paths) |
| `pnpm test:api` / `pnpm test:mobile` | Unit/integration tests |
| `pnpm typecheck:mobile` | TypeScript check for the Expo app |

## Phase 3 — Local API + mobile flow

1. Root `.env`: `DATABASE_URL`, `PORT`, **`CHAT_SESSION_SECRET`**, **`GEMINI_API_KEY`**, **`CORS_ORIGINS`**.
2. Mobile env: `cp apps/mobile/.env.example apps/mobile/.env` and set `EXPO_PUBLIC_API_URL=http://localhost:4000` (or your LAN IP on device).
3. MySQL up + migrations + seed: `pnpm db:up`, `pnpm db:migrate:deploy`, `pnpm db:seed`.
4. API: `pnpm dev:api`
5. Mobile: `pnpm dev:mobile`

For physical devices, point `EXPO_PUBLIC_API_URL` at your machine’s LAN IP, e.g. `http://192.168.1.10:4000`.

## Phase 6 — Web deploy (GitHub Pages + Railway)

**What runs where**

| Piece | Host | Notes |
| ----- | ---- | ----- |
| Expo web (static) | **GitHub Pages** | Deployed by the `deploy-web` job in `.github/workflows/ci.yml` after CI passes on `main` |
| API (Docker) | **Railway** | Builds `apps/api/Dockerfile` from repo root; entrypoint runs **`prisma migrate deploy`**, then starts Express |
| MySQL | **Railway** | Managed MySQL (or equivalent) in the same project |

**GitHub**

1. **Pages**: Repository **Settings → Pages → Build and deployment → Source**: **GitHub Actions**.
2. **Actions variables**: `API_URL` — public Railway API base URL (no trailing slash), used as `EXPO_PUBLIC_API_URL` for the web build.
3. **Actions secrets**: `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN`.

**Railway (API service)**

- **Dockerfile path**: `apps/api/Dockerfile` (build context: repo root).
- **Variables** (examples):
  - `DATABASE_URL` — from MySQL service
  - `GEMINI_API_KEY`
  - **`CHAT_SESSION_SECRET`** — strong random, ≥ 32 characters
  - `CORS_ORIGINS` — your GitHub Pages origin(s), comma-separated (no wildcard)
  - `PORT` — align with Railway (API reads `PORT` from env)
  - **`RUN_DB_SEED=true`** — optional; set **once** for initial data, then remove or set `false` so seed does not run on every deploy
  - `CHAT_HISTORY_LIMIT` — optional

**Local Docker (API + MySQL)**

From the repo root, with `.env` including **`CHAT_SESSION_SECRET`**, **`GEMINI_API_KEY`**, MySQL vars, and **`CORS_ORIGINS`**:

```bash
docker compose -f compose.yml --env-file .env up -d --build
```

The `api` service uses `DATABASE_URL` built from `MYSQL_*` with host `mysql`. The Compose file sets default `CORS_ORIGINS` for local Expo; override in `.env` if needed.

## CI

On push and PRs, `.github/workflows/ci.yml` runs Biome, `prisma migrate deploy` against a MySQL service, API typecheck/tests, mobile typecheck/tests, Expo web export, and a Docker build of the API image.

## Troubleshooting

- **`CHAT_SESSION_SECRET is required`**: Add a long secret to `.env` (see `.env.example`).
- **Migration errors**: Ensure MySQL is healthy (`pnpm db:up`) and `DATABASE_URL` matches the running instance.
- **Chat 401**: Client must call `POST /auth/chat-session` after resolving `clientId`, then send `Authorization: Bearer …` on chat requests (the app does this automatically after hydration).
- **Docker port `3306` occupied**: Set `MYSQL_PORT` in `.env` and adjust `DATABASE_URL` on the host for local non-Docker API use.
- **Pages blank / wrong API**: Set GitHub Actions variable `API_URL` to the deployed API URL; ensure Railway `CORS_ORIGINS` includes your Pages origin.
