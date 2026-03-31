import type { AnyRouter } from "@tanstack/react-router";
import * as Linking from "expo-linking";
import { Platform } from "react-native";

function normalizePath(path?: string | null) {
  if (!path) return "/";
  return path.startsWith("/") ? path : `/${path}`;
}

function navigateFromPath(router: AnyRouter, path?: string | null) {
  const normalized = normalizePath(path);

  if (normalized === "/") {
    router.navigate({ to: "/" });
    return;
  }

  const chatMatch = normalized.match(/^\/chat\/([^/]+)$/);
  if (chatMatch) {
    router.navigate({
      to: "/chat/$slug",
      params: { slug: decodeURIComponent(chatMatch[1]) },
    });
    return;
  }

  router.navigate({ to: "/" });
}

export function syncRouterWithLinking(router: AnyRouter) {
  if (Platform.OS === "web") {
    return () => undefined;
  }

  void Linking.getInitialURL().then((initialUrl) => {
    if (!initialUrl) return;
    const parsed = Linking.parse(initialUrl);
    navigateFromPath(router, parsed.path);
  });

  const subscription = Linking.addEventListener("url", ({ url }) => {
    const parsed = Linking.parse(url);
    navigateFromPath(router, parsed.path);
  });

  return () => {
    subscription.remove();
  };
}
