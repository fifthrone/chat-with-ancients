import { describe, expect, it } from "vitest";
import { assertDatabaseUrlRequired, parseEnv } from "./env-parse";

describe("parseEnv", () => {
  const base = { DATABASE_URL: "mysql://localhost/db" };

  it("defaults PORT to 4000 when unset", () => {
    expect(parseEnv(base).PORT).toBe(4000);
  });

  it("parses PORT from env", () => {
    expect(parseEnv({ ...base, PORT: "8080" }).PORT).toBe(8080);
  });

  it("falls back to default when PORT is not a finite number", () => {
    expect(parseEnv({ ...base, PORT: "nan" }).PORT).toBe(4000);
    expect(parseEnv({ ...base, PORT: "Infinity" }).PORT).toBe(4000);
  });

  it("defaults CHAT_HISTORY_LIMIT to 50", () => {
    expect(parseEnv(base).CHAT_HISTORY_LIMIT).toBe(50);
  });

  it("parses CHAT_HISTORY_LIMIT from env", () => {
    expect(parseEnv({ ...base, CHAT_HISTORY_LIMIT: "100" }).CHAT_HISTORY_LIMIT).toBe(
      100
    );
  });

  it("defaults DATABASE_URL to empty string", () => {
    expect(parseEnv({}).DATABASE_URL).toBe("");
  });

  it("reads DATABASE_URL", () => {
    expect(parseEnv({ DATABASE_URL: "mysql://x" }).DATABASE_URL).toBe("mysql://x");
  });

  it("defaults GEMINI_API_KEY to empty string", () => {
    expect(parseEnv(base).GEMINI_API_KEY).toBe("");
  });

  it("reads GEMINI_API_KEY", () => {
    expect(parseEnv({ ...base, GEMINI_API_KEY: "key" }).GEMINI_API_KEY).toBe("key");
  });

  it("defaults CORS_ORIGINS to wildcard when unset", () => {
    expect(parseEnv(base).CORS_ORIGINS).toEqual(["*"]);
  });

  it("splits and trims CORS_ORIGINS", () => {
    expect(
      parseEnv({ ...base, CORS_ORIGINS: " https://a.com , http://b.com " }).CORS_ORIGINS
    ).toEqual(["https://a.com", "http://b.com"]);
  });

  it("filters empty CORS_ORIGINS segments", () => {
    expect(parseEnv({ ...base, CORS_ORIGINS: "a,,b," }).CORS_ORIGINS).toEqual([
      "a",
      "b",
    ]);
  });
});

describe("assertDatabaseUrlRequired", () => {
  it("throws when DATABASE_URL is empty", () => {
    expect(() => assertDatabaseUrlRequired(parseEnv({}))).toThrow(
      "DATABASE_URL is required"
    );
  });

  it("does not throw when DATABASE_URL is set", () => {
    expect(() =>
      assertDatabaseUrlRequired(parseEnv({ DATABASE_URL: "mysql://x" }))
    ).not.toThrow();
  });
});
