import { describe, expect, it } from "vitest";
import { signChatSessionToken, verifyChatSessionToken } from "./chat-jwt";

const secret = "unit-test-chat-session-secret-32+chars!";

describe("chat-jwt", () => {
  it("round-trips clientId in JWT subject", async () => {
    const clientId = "client_1234567890_abcdef";
    const token = await signChatSessionToken(secret, clientId, 60);
    const { sub } = await verifyChatSessionToken(secret, token);
    expect(sub).toBe(clientId);
  });

  it("rejects tampered token", async () => {
    const token = await signChatSessionToken(secret, "client_a", 60);
    const tampered = `${token.slice(0, -4)}xxxx`;
    await expect(verifyChatSessionToken(secret, tampered)).rejects.toThrow();
  });
});
