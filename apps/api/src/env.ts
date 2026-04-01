import { config } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));

// Support monorepo root `.env` when running `pnpm dev:api`.
config({ path: resolve(currentDir, "../../../.env") });
// Allow per-app overrides in `apps/api/.env` if present.
config({ path: resolve(currentDir, "../.env"), override: true });

const asNumber = (value: string | undefined, fallback: number) => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const splitOrigins = (value: string | undefined): string[] => {
  if (!value) return ["*"];
  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
};

export const env = {
  PORT: asNumber(process.env.PORT, 4000),
  DATABASE_URL: process.env.DATABASE_URL ?? "",
  CORS_ORIGINS: splitOrigins(process.env.CORS_ORIGINS),
  GEMINI_API_KEY: process.env.GEMINI_API_KEY ?? "",
  CHAT_HISTORY_LIMIT: asNumber(process.env.CHAT_HISTORY_LIMIT, 50),
};

if (!env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}
