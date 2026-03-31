import { useQuery } from "@tanstack/react-query";
import { EXPO_PUBLIC_API_URL } from "../config/env";

export type Ancient = {
  id: number;
  slug: string;
  name: string;
  region: string;
  latitude: number;
  longitude: number;
  avatarUrl: string | null;
  eraLabel: string;
  shortBio: string;
  systemPrompt: string;
};

class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "ApiError";
  }
}

const getApiBaseUrl = () => {
  if (!EXPO_PUBLIC_API_URL) {
    throw new Error("EXPO_PUBLIC_API_URL is not set");
  }

  return EXPO_PUBLIC_API_URL.replace(/\/+$/, "");
};

const apiGet = async <T>(path: string): Promise<T> => {
  const response = await fetch(`${getApiBaseUrl()}${path}`);

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const body = (await response.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      // Ignore body parse errors and keep generic message.
    }

    throw new ApiError(message, response.status);
  }

  return response.json() as Promise<T>;
};

export const useAncients = () =>
  useQuery({
    queryKey: ["ancients"],
    queryFn: () => apiGet<Ancient[]>("/ancients"),
  });

export const useAncient = (slug: string) =>
  useQuery({
    queryKey: ["ancient", slug],
    queryFn: () => apiGet<Ancient>(`/ancients/${encodeURIComponent(slug)}`),
  });
