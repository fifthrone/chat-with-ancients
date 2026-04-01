const asNumber = (value: string | undefined, fallback: number) => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

/** Local Expo / web dev origins when CORS_ORIGINS is unset (non-production only). */
const defaultDevCorsOrigins = (): string[] => [
  "http://localhost:8081",
  "http://localhost:19006",
  "http://localhost:8082",
  "http://127.0.0.1:8081",
  "http://127.0.0.1:19006",
  "http://127.0.0.1:8082",
];

const splitOrigins = (
  value: string | undefined,
  nodeEnv: string | undefined,
): string[] => {
  if (value === undefined || value.trim() === "") {
    return nodeEnv === "production" ? [] : defaultDevCorsOrigins();
  }
  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
};

export type ParsedEnv = {
  PORT: number;
  DATABASE_URL: string;
  NODE_ENV: string;
  CORS_ORIGINS: string[];
  GEMINI_API_KEY: string;
  CHAT_HISTORY_LIMIT: number;
  CHAT_SESSION_SECRET: string;
};

export function parseEnv(
  processEnv: NodeJS.ProcessEnv | Record<string, string | undefined>,
): ParsedEnv {
  const nodeEnv = processEnv.NODE_ENV ?? "development";
  return {
    PORT: asNumber(processEnv.PORT, 4000),
    DATABASE_URL: processEnv.DATABASE_URL ?? "",
    NODE_ENV: nodeEnv,
    CORS_ORIGINS: splitOrigins(processEnv.CORS_ORIGINS, nodeEnv),
    GEMINI_API_KEY: processEnv.GEMINI_API_KEY ?? "",
    CHAT_HISTORY_LIMIT: asNumber(processEnv.CHAT_HISTORY_LIMIT, 50),
    CHAT_SESSION_SECRET: processEnv.CHAT_SESSION_SECRET ?? "",
  };
}

export function assertDatabaseUrlRequired(env: ParsedEnv): void {
  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }
}

export function assertProductionChatAndCors(env: ParsedEnv): void {
  if (env.NODE_ENV !== "production") return;

  if (env.CORS_ORIGINS.length === 0) {
    throw new Error(
      "CORS_ORIGINS must list explicit origins in production (comma-separated). Wildcard is not allowed.",
    );
  }
  if (env.CORS_ORIGINS.includes("*")) {
    throw new Error("CORS_ORIGINS must not use '*' in production");
  }

  if (env.CHAT_SESSION_SECRET.length < 32) {
    throw new Error(
      "CHAT_SESSION_SECRET must be at least 32 characters in production (use a strong random value)",
    );
  }
}
