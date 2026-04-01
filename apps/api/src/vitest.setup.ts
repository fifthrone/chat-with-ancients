/**
 * Loaded before test files so `import "./env"` succeeds when modules are evaluated.
 */
process.env.DATABASE_URL ??=
  "mysql://test:test@127.0.0.1:3306/chat_with_ancients_test";
process.env.CHAT_SESSION_SECRET ??= "test-chat-session-secret-min-32-chars!";
process.env.NODE_ENV ??= "test";
process.env.CORS_ORIGINS ??= "http://localhost:8081";
