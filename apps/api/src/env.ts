import { config } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { assertDatabaseUrlRequired, parseEnv } from "./env-parse";

const currentDir = dirname(fileURLToPath(import.meta.url));

// Support monorepo root `.env` when running `pnpm dev:api`.
config({ path: resolve(currentDir, "../../../.env") });
// Allow per-app overrides in `apps/api/.env` if present.
config({ path: resolve(currentDir, "../.env"), override: true });

export const env = parseEnv(process.env);
assertDatabaseUrlRequired(env);
