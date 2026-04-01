import { getApiBaseUrl } from "../config/apiBase";

const tokenByClientId = new Map<string, string>();

export async function fetchChatSessionToken(clientId: string): Promise<string> {
  const cached = tokenByClientId.get(clientId);
  if (cached) return cached;

  const response = await fetch(`${getApiBaseUrl()}/auth/chat-session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientId }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Failed to obtain chat session (${response.status})${text ? `: ${text.slice(0, 200)}` : ""}`,
    );
  }

  const body = (await response.json()) as { token?: string };
  if (!body.token || typeof body.token !== "string") {
    throw new Error("Invalid chat session response");
  }

  tokenByClientId.set(clientId, body.token);
  return body.token;
}

/** Call when rotating client id (e.g. new chat) so the next request mints a fresh token. */
export function invalidateChatSessionToken(clientId: string): void {
  tokenByClientId.delete(clientId);
}
