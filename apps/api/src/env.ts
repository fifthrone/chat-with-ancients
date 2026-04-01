import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import {
  assertDatabaseUrlRequired,
  assertProductionChatAndCors,
  parseEnv,
} from "./env-parse";

const currentDir = dirname(fileURLToPath(import.meta.url));

// Support monorepo root `.env` when running `pnpm dev:api`.
config({ path: resolve(currentDir, "../../../.env") });
// Allow per-app overrides in `apps/api/.env` if present.
config({ path: resolve(currentDir, "../.env"), override: true });

export const env = parseEnv(process.env);
assertDatabaseUrlRequired(env);
assertProductionChatAndCors(env);

if (env.NODE_ENV !== "production" && env.CHAT_SESSION_SECRET.length < 16) {
  throw new Error(
    "CHAT_SESSION_SECRET is required for chat auth (min 16 characters in development). See .env.example.",
  );
}
