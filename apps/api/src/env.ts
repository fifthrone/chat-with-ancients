import "dotenv/config";

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
};

if (!env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}
