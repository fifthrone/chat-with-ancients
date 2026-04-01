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

export type ParsedEnv = {
  PORT: number;
  DATABASE_URL: string;
  CORS_ORIGINS: string[];
  GEMINI_API_KEY: string;
  CHAT_HISTORY_LIMIT: number;
};

export function parseEnv(
  processEnv: NodeJS.ProcessEnv | Record<string, string | undefined>
): ParsedEnv {
  return {
    PORT: asNumber(processEnv.PORT, 4000),
    DATABASE_URL: processEnv.DATABASE_URL ?? "",
    CORS_ORIGINS: splitOrigins(processEnv.CORS_ORIGINS),
    GEMINI_API_KEY: processEnv.GEMINI_API_KEY ?? "",
    CHAT_HISTORY_LIMIT: asNumber(processEnv.CHAT_HISTORY_LIMIT, 50),
  };
}

export function assertDatabaseUrlRequired(env: ParsedEnv): void {
  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }
}
