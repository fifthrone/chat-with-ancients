# Chat With Ancients

Chat With Ancients is a cross-platform, map-focused AI chat app where users explore places tied to historical figures and have guided conversations with them. It includes a mobile/web client, an API layer, and a database-backed content model for ancients, locations, chat history, and related app data.

## Tech stack

- **Expo + React Native** for the mobile-first app and shared cross-platform UI (including web builds).
- **TanStack** (TanStack Query/Router ecosystem) for data fetching, cache management, and app navigation patterns.
- **Express** for the backend HTTP API and application server logic.
- **Prisma** for type-safe database access, schema management, and seeding workflows.
- **CI/CD with GitHub Actions** for automated build/deploy workflows (including web deployment).

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

## Phase 6 — Web deploy (GitHub Pages + Railway)

**What runs where**

| Piece | Host | Notes |
| ----- | ---- | ----- |
| Expo web (static) | **GitHub Pages** | Built by `.github/workflows/deploy-web.yml` on push to `main` |
| API (Docker) | **Railway** | Builds `apps/api/Dockerfile` from repo root; entrypoint runs `db push` + seed, then starts Express |
| MySQL | **Railway** | Managed MySQL plugin in the same Railway project |

**GitHub**

1. **Pages**: Repository **Settings → Pages → Build and deployment → Source**: **GitHub Actions**.
2. **Actions variables** (Settings → Secrets and variables → Actions → Variables):
   - `API_URL` — public Railway API base URL, e.g. `https://your-service.up.railway.app` (no trailing slash). Injected at build time as `EXPO_PUBLIC_API_URL`.
3. **Actions secrets**:
   - `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN` — same value as local Mapbox token (required for the map on web).

**GitHub Pages URL vs `baseUrl`**

The app is configured for a **project site** at `https://<user>.github.io/chat-with-ancients/`. If your GitHub repo slug is different, set `expo.experiments.baseUrl` in `apps/mobile/app.json` to `"/<your-repo-name>/"`. For a **user** site (`https://<user>.github.io/` with repo `<user>.github.io`), use `"/"`.

**Railway (one-time)**

1. Create a project and add a **MySQL** service (Railway plugin). Note or reference the generated `DATABASE_URL`.
2. Add a **new service** from **GitHub** → connect this repo.
3. Under the API service **Settings**:
   - **Root directory**: repository root (`.`).
   - **Dockerfile path**: `apps/api/Dockerfile`.
   - Optional **watch paths**: `apps/api/**`, `packages/db/**` so unrelated changes do not redeploy the API.
4. **Variables** on the API service (examples):
   - `DATABASE_URL` — reference the MySQL service variable (e.g. `${{MySQL.DATABASE_URL}}` in Railway’s variable UI).
   - `GEMINI_API_KEY` — your Google AI key.
   - `PORT` — set to `4000`, or use Railway’s `${{PORT}}` and ensure the service listens on `process.env.PORT` (the API already does).
   - `CORS_ORIGINS` — your GitHub Pages origin, e.g. `https://<user>.github.io` (comma-separated if multiple).
   - `CHAT_HISTORY_LIMIT` — optional, default `50`.

Railway will rebuild the API image on pushes to the connected branch (e.g. `main`).

**Local Docker (API + MySQL)**

From the repo root, with `.env` matching `.env.example` (including `GEMINI_API_KEY` for chat):

```bash
docker compose -f compose.yml --env-file .env up -d --build
```

The `api` service uses `DATABASE_URL` built from `MYSQL_*` variables with host `mysql` (the Compose service name). Your host machine still uses `DATABASE_URL` with `localhost` when running `pnpm dev:api` outside Docker.

## Troubleshooting

- If `db:push` fails with connection errors, verify `.env` exists and MySQL is healthy (`pnpm db:up`).
- If Docker port `3306` is occupied, set `MYSQL_PORT` in `.env` and update `DATABASE_URL` to match.
- GitHub Actions web deploy fails on Mapbox: add `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN` as a repository secret.
- GitHub Actions web deploy shows a blank app or wrong API host: set the `API_URL` variable to your deployed Railway API URL.
