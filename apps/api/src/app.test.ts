import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "./app";
import { signChatSessionToken } from "./auth/chat-jwt";
import { prisma } from "./db";

vi.mock("./db", () => ({
  prisma: {
    ancient: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    conversation: { upsert: vi.fn() },
    message: { findMany: vi.fn(), create: vi.fn() },
  },
}));

describe("createApp", () => {
  const clientId = "client_integration_test_12345678";

  beforeEach(() => {
    vi.mocked(prisma.ancient.findMany).mockResolvedValue([]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("GET /health returns ok", async () => {
    const res = await request(createApp()).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("POST /auth/chat-session returns a bearer token", async () => {
    const res = await request(createApp())
      .post("/auth/chat-session")
      .send({ clientId });
    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe("string");
    expect(res.body.expiresIn).toBe(60 * 60 * 24 * 7);
  });

  it("GET /chat/conversation returns 401 without Authorization", async () => {
    const res = await request(createApp())
      .get("/chat/conversation")
      .query({ slug: "socrates" });
    expect(res.status).toBe(401);
  });

  it("GET /chat/conversation returns messages when Prisma is stubbed", async () => {
    const secret = process.env.CHAT_SESSION_SECRET;
    if (!secret) {
      throw new Error("CHAT_SESSION_SECRET must be set by vitest.setup.ts");
    }
    const token = await signChatSessionToken(secret, clientId, 120);

    vi.mocked(prisma.ancient.findUnique).mockResolvedValue({
      id: 1,
      slug: "socrates",
      name: "Socrates",
      eraLabel: "Classical",
      region: "Greece",
      systemPrompt: "Be thoughtful.",
    } as Awaited<ReturnType<typeof prisma.ancient.findUnique>>);

    vi.mocked(prisma.conversation.upsert).mockResolvedValue({
      id: 10,
      clientId,
      ancientId: 1,
      title: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(prisma.message.findMany).mockResolvedValue([
      {
        id: 1,
        role: "user",
        content: "Hello",
        createdAt: new Date(),
      },
    ] as Awaited<ReturnType<typeof prisma.message.findMany>>);

    const res = await request(createApp())
      .get("/chat/conversation")
      .query({ slug: "socrates" })
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.messages).toHaveLength(1);
    expect(res.body.messages[0].content).toBe("Hello");
  });
});
