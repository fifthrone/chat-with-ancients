import { createRootRoute, createRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { StatusBar } from "expo-status-bar";
import { Pressable, Text, View } from "react-native";
import { EXPO_PUBLIC_API_URL } from "../config/env";

function RootLayout() {
  return (
    <View className="flex-1 bg-background">
      <StatusBar style="light" />
      <Outlet />
    </View>
  );
}

function MapStubScreen() {
  const navigate = useNavigate({ from: "/" });

  return (
    <View className="flex-1 items-center justify-center gap-4 px-6">
      <Text className="font-display text-3xl text-textPrimary">Chat With Ancients</Text>
      <Text className="font-body text-center text-base text-textSecondary">
        Phase 1 map placeholder screen
      </Text>
      <Text className="font-body text-center text-xs text-textSecondary">
        API URL: {EXPO_PUBLIC_API_URL || "not set"}
      </Text>
      <Pressable
        className="rounded-xl bg-accent px-5 py-3"
        onPress={() => navigate({ to: "/chat/$slug", params: { slug: "socrates" } })}
      >
        <Text className="font-body text-base font-semibold text-background">Open Socrates Chat</Text>
      </Pressable>
    </View>
  );
}

function ChatStubScreen() {
  const { slug } = chatRoute.useParams();

  return (
    <View className="flex-1 items-center justify-center gap-3 px-6">
      <Text className="font-display text-3xl text-textPrimary">Ancient Chat</Text>
      <Text className="font-body text-base text-textSecondary">Selected ancient: {slug}</Text>
    </View>
  );
}

const rootRoute = createRootRoute({
  component: RootLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: MapStubScreen,
});

export const chatRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/chat/$slug",
  component: ChatStubScreen,
});

export const routeTree = rootRoute.addChildren([indexRoute, chatRoute]);
