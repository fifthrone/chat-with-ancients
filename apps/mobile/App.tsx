import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import "mapbox-gl/dist/mapbox-gl.css";
import "./global.css";
import { syncRouterWithLinking } from "./src/linking/syncRouterWithLinking";
import { router } from "./src/router/router";

const queryClient = new QueryClient();

export default function App() {
  const [isBootstrapped, setIsBootstrapped] = useState(false);

  useEffect(() => {
    const unsubscribe = syncRouterWithLinking(router);
    setIsBootstrapped(true);
    return () => {
      unsubscribe?.();
    };
  }, []);

  if (!isBootstrapped) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-background">
        <ActivityIndicator color="#111827" />
        <Text className="font-body text-sm text-textSecondary">
          Loading app...
        </Text>
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
