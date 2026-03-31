import { createRootRoute, createRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { StatusBar } from "expo-status-bar";
import { Pressable, Text, View } from "react-native";
import { useAncient, useAncients } from "../api/ancients";
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
  const ancientsQuery = useAncients();

  return (
    <View className="flex-1 items-center justify-center gap-4 px-6">
      <Text className="font-display text-3xl text-textPrimary">Chat With Ancients</Text>
      <Text className="font-body text-center text-base text-textSecondary">Phase 3 data list screen</Text>
      <Text className="font-body text-center text-xs text-textSecondary">
        API URL: {EXPO_PUBLIC_API_URL || "not set"}
      </Text>
      {ancientsQuery.isLoading ? (
        <Text className="font-body text-sm text-textSecondary">Loading ancients...</Text>
      ) : null}
      {ancientsQuery.isError ? (
        <Text className="font-body text-sm text-red-300">
          Failed to load ancients: {ancientsQuery.error.message}
        </Text>
      ) : null}
      {ancientsQuery.isSuccess && ancientsQuery.data.length === 0 ? (
        <Text className="font-body text-sm text-textSecondary">No ancients found.</Text>
      ) : null}
      {ancientsQuery.data?.map((ancient) => (
        <Pressable
          key={ancient.slug}
          className="w-full rounded-xl bg-accent px-5 py-3"
          onPress={() => navigate({ to: "/chat/$slug", params: { slug: ancient.slug } })}
        >
          <Text className="font-body text-base font-semibold text-background">{ancient.name}</Text>
          <Text className="font-body text-xs text-background">{ancient.eraLabel}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function ChatStubScreen() {
  const { slug } = chatRoute.useParams();
  const ancientQuery = useAncient(slug);

  return (
    <View className="flex-1 items-center justify-center gap-3 px-6">
      <Text className="font-display text-3xl text-textPrimary">Ancient Chat</Text>
      <Text className="font-body text-base text-textSecondary">Slug: {slug}</Text>
      {ancientQuery.isLoading ? <Text className="font-body text-sm text-textSecondary">Loading...</Text> : null}
      {ancientQuery.isError ? (
        <Text className="font-body text-sm text-red-300">{ancientQuery.error.message}</Text>
      ) : null}
      {ancientQuery.data ? (
        <>
          <Text className="font-body text-base text-textPrimary">{ancientQuery.data.name}</Text>
          <Text className="font-body text-sm text-textSecondary">{ancientQuery.data.region}</Text>
          <Text className="font-body text-sm text-textSecondary">{ancientQuery.data.shortBio}</Text>
        </>
      ) : null}
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
