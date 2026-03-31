import { createRootRoute, createRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { StatusBar } from "expo-status-bar";
import { type ComponentType, createElement, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Platform, Pressable, Text, View } from "react-native";
import { useAncient, useAncients } from "../api/ancients";
import { EXPO_PUBLIC_API_URL, EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN } from "../config/env";

type Coordinate = [number, number];

const defaultCenter: Coordinate = [12.4964, 41.9028];

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
  const cameraRef = useRef<any>(null);
  const webMapContainerRef = useRef<any>(null);
  const hasMapboxToken = EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN.trim().length > 0;
  const isNative = Platform.OS === "ios" || Platform.OS === "android";
  const isWeb = Platform.OS === "web";
  const [webMapError, setWebMapError] = useState<string | null>(null);
  const isDev = typeof __DEV__ !== "undefined" ? __DEV__ : false;

  const markerAncients = useMemo(
    () =>
      (ancientsQuery.data ?? []).filter(
        (ancient) => Number.isFinite(ancient.latitude) && Number.isFinite(ancient.longitude),
      ),
    [ancientsQuery.data],
  );

  const mapbox = useMemo(() => {
    if (!isNative) return null;
    // Expo Go doesn't include this native module; fall back instead of crashing.
    try {
      return require("@rnmapbox/maps");
    } catch {
      return null;
    }
  }, [isNative]);

  const mapboxModule = useMemo(() => {
    if (!mapbox) return null;
    return (mapbox.default ?? mapbox) as Record<string, any>;
  }, [mapbox]);

  useEffect(() => {
    if (!mapboxModule || !hasMapboxToken) return;
    const setAccessToken = mapboxModule.setAccessToken;
    if (typeof setAccessToken === "function") {
      setAccessToken(EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN);
    }
  }, [hasMapboxToken, mapboxModule]);

  useEffect(() => {
    if (!cameraRef.current || markerAncients.length === 0) return;

    const longitudes = markerAncients.map((ancient) => ancient.longitude);
    const latitudes = markerAncients.map((ancient) => ancient.latitude);
    const ne: Coordinate = [Math.max(...longitudes), Math.max(...latitudes)];
    const sw: Coordinate = [Math.min(...longitudes), Math.min(...latitudes)];
    cameraRef.current.fitBounds(ne, sw, [80, 80, 80, 80], 1000);
  }, [markerAncients]);

  useEffect(() => {
    if (!isWeb || !hasMapboxToken || ancientsQuery.isLoading || ancientsQuery.isError) return;
    if (markerAncients.length === 0 || !webMapContainerRef.current) return;

    let isCancelled = false;
    let map: any;

    const initWebMap = async () => {
      try {
        const mapboxGlModule = await import("mapbox-gl");
        if (isCancelled || !webMapContainerRef.current) return;

        const mapboxgl = mapboxGlModule.default;
        const webDocument = (globalThis as any).document;
        if (!webDocument) {
          throw new Error("Document is unavailable on this platform");
        }

        mapboxgl.accessToken = EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;
        setWebMapError(null);

        map = new mapboxgl.Map({
          container: webMapContainerRef.current,
          style: "mapbox://styles/mapbox/streets-v12",
          center: defaultCenter,
          zoom: 1.5,
        });

        const bounds = new mapboxgl.LngLatBounds();
        for (const ancient of markerAncients) {
          const markerNode = webDocument.createElement("button");
          markerNode.type = "button";
          markerNode.textContent = ancient.name.slice(0, 2).toUpperCase();
          markerNode.style.width = "40px";
          markerNode.style.height = "40px";
          markerNode.style.borderRadius = "9999px";
          markerNode.style.border = "2px solid #131313";
          markerNode.style.background = "#f7b500";
          markerNode.style.color = "#131313";
          markerNode.style.fontWeight = "700";
          markerNode.style.cursor = "pointer";
          markerNode.onclick = () => {
            if (!ancient.slug) return;
            navigate({ to: "/chat/$slug", params: { slug: ancient.slug } });
          };

          new mapboxgl.Marker({ element: markerNode })
            .setLngLat([ancient.longitude, ancient.latitude])
            .addTo(map);

          bounds.extend([ancient.longitude, ancient.latitude]);
        }

        if (!bounds.isEmpty()) {
          map.fitBounds(bounds, { padding: 80, duration: 1000, maxZoom: 4 });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown Mapbox web error";
        setWebMapError("Could not initialize the map. Please try again.");
        if (isDev) {
          console.error("Mapbox web initialization failed:", message);
        }
      }
    };

    void initWebMap();

    return () => {
      isCancelled = true;
      if (map) {
        map.remove();
      }
    };
  }, [
    ancientsQuery.isError,
    ancientsQuery.isLoading,
    hasMapboxToken,
    isWeb,
    markerAncients,
    navigate,
  ]);

  if (!isNative && !isWeb) {
    return (
      <View className="flex-1 items-center justify-center gap-3 px-6">
        <Text className="font-display text-3xl text-textPrimary">Chat With Ancients</Text>
        <Text className="font-body text-center text-base text-textSecondary">
          This platform is not supported for map rendering.
        </Text>
      </View>
    );
  }

  if (!hasMapboxToken) {
    return (
      <View className="flex-1 items-center justify-center gap-3 px-6">
        <Text className="font-display text-3xl text-textPrimary">Missing Mapbox token</Text>
        <Text className="font-body text-center text-sm text-textSecondary">
          Set EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN in apps/mobile/.env to render the map.
        </Text>
      </View>
    );
  }

  if (ancientsQuery.isLoading) {
    return (
      <View className="flex-1 items-center justify-center gap-3">
        <ActivityIndicator />
        <Text className="font-body text-sm text-textSecondary">Loading map data...</Text>
      </View>
    );
  }

  if (ancientsQuery.isError) {
    if (isDev) {
      console.error("Failed to load ancients:", ancientsQuery.error);
    }
    return (
      <View className="flex-1 items-center justify-center gap-3 px-6">
        <Text className="font-display text-2xl text-textPrimary">Could not load ancients</Text>
        <Text className="font-body text-center text-sm text-textSecondary">
          We could not load the data right now. Please try again in a moment.
        </Text>
        {isDev ? (
          <>
            <Text className="font-body text-center text-xs text-red-300">{ancientsQuery.error.message}</Text>
            <Text className="font-body text-center text-xs text-textSecondary">
              API URL: {EXPO_PUBLIC_API_URL || "not set"}
            </Text>
          </>
        ) : null}
      </View>
    );
  }

  if (markerAncients.length === 0) {
    return (
      <View className="flex-1 items-center justify-center gap-3 px-6">
        <Text className="font-display text-2xl text-textPrimary">No mappable ancients</Text>
        <Text className="font-body text-center text-sm text-textSecondary">
          Add rows with latitude and longitude in the API data source.
        </Text>
      </View>
    );
  }

  if (isWeb) {
    return (
      <View className="flex-1">
        {webMapError ? (
          <View className="absolute inset-x-4 top-4 z-10 rounded-md bg-red-950/80 p-3">
            <Text className="font-body text-xs text-red-200">{webMapError}</Text>
          </View>
        ) : null}
        {createElement("div", {
          ref: webMapContainerRef,
          style: { width: "100%", height: "100%" },
        })}
      </View>
    );
  }

  if (!mapboxModule) {
    return (
      <View className="flex-1 items-center justify-center gap-3 px-6">
        <Text className="font-display text-2xl text-textPrimary">Map module unavailable</Text>
        <Text className="font-body text-center text-sm text-textSecondary">
          @rnmapbox/maps requires a native dev build. If you are running Expo Go, create and run a
          development build, then rebuild after installing/configuring Mapbox.
        </Text>
      </View>
    );
  }

  const MapView = mapboxModule.MapView as ComponentType<any>;
  const Camera = mapboxModule.Camera as ComponentType<any>;
  const PointAnnotation = mapboxModule.PointAnnotation as ComponentType<any>;

  return (
    <View className="flex-1">
      <MapView style={{ flex: 1 }} styleURL="mapbox://styles/mapbox/streets-v12">
        <Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate: defaultCenter,
            zoomLevel: 1.5,
          }}
        />
        {markerAncients.map((ancient) => (
          <PointAnnotation
            key={ancient.slug}
            id={ancient.slug}
            coordinate={[ancient.longitude, ancient.latitude]}
          >
            <Pressable
              className="h-10 w-10 items-center justify-center rounded-full border-2 border-background bg-accent"
              onPress={() => {
                if (!ancient.slug) return;
                navigate({ to: "/chat/$slug", params: { slug: ancient.slug } });
              }}
            >
              <Text className="font-body text-xs font-semibold text-background">
                {ancient.name.slice(0, 2).toUpperCase()}
              </Text>
            </Pressable>
          </PointAnnotation>
        ))}
      </MapView>
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
