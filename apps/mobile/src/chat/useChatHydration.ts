import { useEffect, useState } from "react";
import type { UIMessage } from "ai";
import { EXPO_PUBLIC_API_URL } from "../config/env";

const chatClientIdStorageKey = "chat-with-ancients/client-id";

export const getApiBaseUrl = () => EXPO_PUBLIC_API_URL.replace(/\/+$/, "");

type KeyValueStorage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
};

const memoryStorageData = new Map<string, string>();

const memoryStorage: KeyValueStorage = {
  getItem: async (key) => memoryStorageData.get(key) ?? null,
  setItem: async (key, value) => {
    memoryStorageData.set(key, value);
  },
};

let cachedStorage: KeyValueStorage | null = null;

const getStorage = (): KeyValueStorage => {
  if (cachedStorage) return cachedStorage;

  try {
    // Lazy-load to avoid crashing app startup when native module isn't linked.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const AsyncStorage = require("@react-native-async-storage/async-storage").default as
      | KeyValueStorage
      | undefined;
    if (AsyncStorage?.getItem && AsyncStorage?.setItem) {
      cachedStorage = AsyncStorage;
      return cachedStorage;
    }
  } catch {
    // Fall back below.
  }

  cachedStorage = memoryStorage;
  return cachedStorage;
};

const getOrCreateClientId = async () => {
  const storage = getStorage();
  const existing = await storage.getItem(chatClientIdStorageKey);
  if (existing) return existing;
  const generated = `client_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  await storage.setItem(chatClientIdStorageKey, generated);
  return generated;
};

type PersistedMessage = {
  id: number;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
};

const fetchConversation = async (slug: string, clientId: string) => {
  const response = await fetch(
    `${getApiBaseUrl()}/chat/conversation?slug=${encodeURIComponent(slug)}&clientId=${encodeURIComponent(clientId)}`,
  );

  if (!response.ok) {
    throw new Error(`Failed to load chat history (${response.status})`);
  }

  const body = (await response.json()) as { messages: PersistedMessage[] };
  return body.messages;
};

const persistedToUIMessages = (rows: PersistedMessage[]): UIMessage[] =>
  rows.map((row) => ({
    id: `db-${row.id}`,
    role: row.role === "system" ? "user" : row.role,
    parts: [{ type: "text" as const, text: row.content, state: "done" as const }],
  }));

export type HydrationState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; clientId: string; initialMessages: UIMessage[] };

export function useChatHydration(slug: string): HydrationState {
  const [hydration, setHydration] = useState<HydrationState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    setHydration({ status: "loading" });

    const load = async () => {
      try {
        const clientId = await getOrCreateClientId();
        const rows = await fetchConversation(slug, clientId);
        const initialMessages = persistedToUIMessages(rows);
        if (!cancelled) {
          setHydration({ status: "ready", clientId, initialMessages });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to load chat history";
        if (!cancelled) {
          setHydration({ status: "error", message });
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return hydration;
}
