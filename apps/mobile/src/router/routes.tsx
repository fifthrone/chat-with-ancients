import { createRootRoute, createRoute, Outlet } from "@tanstack/react-router";
import { StatusBar } from "expo-status-bar";
import { type ComponentType, createElement, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Image, Platform, Pressable, Text, View } from "react-native";
import { type Ancient, useAncients } from "../api/ancients";
import { AncientChatScreen } from "../chat/AncientChatScreen";
import { getAncientImageSource, getAncientInitials, getAncientWebImageUrl } from "../chat/ancientImages";
import { NativeChatSheet } from "../chat/NativeChatSheet";
import { WebChatPanel } from "../chat/WebChatPanel";
import { EXPO_PUBLIC_API_URL, EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN } from "../config/env";

type Coordinate = [number, number];

const defaultCenter: Coordinate = [12.4964, 41.9028];

function MapSelectAncientHint({ webZIndex }: { webZIndex?: number }) {
  return (
    <View
      pointerEvents="none"
      className="absolute inset-x-0 top-0 items-center px-4 pt-6"
      style={webZIndex != null ? { zIndex: webZIndex } : undefined}
    >
      <View className="max-w-sm rounded-3xl border border-textPrimary/10 bg-surface px-8 py-4 shadow-lg shadow-black/10">
        <Text className="text-center font-display font-semibold text-lg leading-snug text-textPrimary">
          Chat With Ancients
        </Text>
        <Text className="mt-1.5 text-center font-body text-sm leading-relaxed text-textSecondary">
        Select someone on the map to begin.
        </Text>
      </View>
    </View>
  );
}

function RootLayout() {
  return (
    <View className="flex-1 bg-background">
      <StatusBar style="dark" />
      <Outlet />
    </View>
  );
}

function MapStubScreen() {
  const ancientsQuery = useAncients();
  const cameraRef = useRef<any>(null);
  const webMapContainerRef = useRef<any>(null);
  const webMapInstanceRef = useRef<any>(null);
  const hasMapboxToken = EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN.trim().length > 0;
  const isNative = Platform.OS === "ios" || Platform.OS === "android";
  const isWeb = Platform.OS === "web";
  const [webMapError, setWebMapError] = useState<string | null>(null);
  const isDev = typeof __DEV__ !== "undefined" ? __DEV__ : false;

  const [selectedAncientSlug, setSelectedAncientSlug] = useState<string | null>(null);
  const [selectedAncient, setSelectedAncient] = useState<Ancient | null>(null);

  const markerAncients = useMemo(
    () =>
      (ancientsQuery.data ?? []).filter(
        (ancient) => Number.isFinite(ancient.latitude) && Number.isFinite(ancient.longitude),
      ),
    [ancientsQuery.data],
  );

  const mapbox = useMemo(() => {
    if (!isNative) return null;
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
          style: "mapbox://styles/mapbox/light-v11",
          center: defaultCenter,
          zoom: 1.5,
        });
        webMapInstanceRef.current = map;

        const bounds = new mapboxgl.LngLatBounds();
        for (const ancient of markerAncients) {
          const markerNode = webDocument.createElement("button");
          const imageUrl = getAncientWebImageUrl(ancient.slug, ancient.avatarUrl);
          markerNode.type = "button";
          markerNode.textContent = imageUrl ? "" : getAncientInitials(ancient.name);
          markerNode.style.width = "100px";
          markerNode.style.height = "120px";
          markerNode.style.borderRadius = "0";
          markerNode.style.background = imageUrl ? `url("${imageUrl}") center / contain no-repeat` : "#f7b500";
          markerNode.style.color = "#131313";
          markerNode.style.fontWeight = "700";
          markerNode.style.cursor = "pointer";
          markerNode.onclick = () => {
            if (!ancient.slug) return;
            setSelectedAncientSlug(ancient.slug);
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
      webMapInstanceRef.current = null;
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
  ]);

  const webChatPanelWidth = 424;

  useEffect(() => {
    const map = webMapInstanceRef.current;
    if (!map || !isWeb) return;
    const rightPad = selectedAncientSlug ? webChatPanelWidth : 0;
    const padding = { top: 0, bottom: 0, left: 0, right: rightPad };

    const target = selectedAncientSlug
      ? markerAncients.find((a) => a.slug === selectedAncientSlug)
      : null;

    if (target) {
      map.flyTo({
        center: [target.longitude, target.latitude],
        zoom: Math.max(map.getZoom(), 4),
        padding,
        duration: 1000,
      });
    } else {
      map.easeTo({ padding, duration: 300 });
    }

    const container = map.getContainer() as HTMLElement | null;
    if (!container) return;
    const ctrls = container.querySelectorAll(
      ".mapboxgl-ctrl-bottom-right, .mapboxgl-ctrl-bottom-left, .mapboxgl-ctrl-top-right",
    );
    for (const el of Array.from(ctrls)) {
      const ctrl = el as HTMLElement;
      ctrl.style.transition = "right 300ms ease, padding-right 300ms ease";
      if (ctrl.classList.contains("mapboxgl-ctrl-bottom-right") || ctrl.classList.contains("mapboxgl-ctrl-top-right")) {
        ctrl.style.right = `${rightPad}px`;
      }
    }
  }, [selectedAncientSlug, isWeb, markerAncients]);

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
        <ActivityIndicator color="#111827" />
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
            <Text className="font-body text-center text-xs text-red-700">{ancientsQuery.error.message}</Text>
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
      <View style={{ flex: 1 }}>
        {webMapError ? (
          <View className="absolute inset-x-4 top-4 z-10 rounded-md bg-red-50 p-3">
            <Text className="font-body text-xs text-red-700">{webMapError}</Text>
          </View>
        ) : null}
        {createElement("div", {
          ref: webMapContainerRef,
          style: { width: "100%", height: "100%" },
        })}
        {!selectedAncientSlug ? <MapSelectAncientHint webZIndex={15} /> : null}
        {selectedAncientSlug ? (
          <View
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              width: webChatPanelWidth,
              zIndex: 20,
            }}
          >
            <WebChatPanel
              slug={selectedAncientSlug}
              onClose={() => setSelectedAncientSlug(null)}
            />
          </View>
        ) : null}
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
      <MapView style={{ flex: 1 }} styleURL="mapbox://styles/mapbox/light-v11">
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
            onSelected={() => {
              if (!ancient.slug) return;
              setSelectedAncient(ancient);
              cameraRef.current?.flyTo([ancient.longitude, ancient.latitude], 1000);
            }}
          >
            <Pressable
              className="h-10 w-10 items-center justify-center bg-accent"
              onPress={() => {
                if (!ancient.slug) return;
                setSelectedAncient(ancient);
                cameraRef.current?.flyTo([ancient.longitude, ancient.latitude], 1000);
              }}
            >
              {getAncientImageSource(ancient.slug, ancient.avatarUrl) ? (
                <Image
                  source={getAncientImageSource(ancient.slug, ancient.avatarUrl)!}
                  style={{ width: 40, height: 40 }}
                  resizeMode="contain"
                />
              ) : (
                <Text className="font-body text-xs font-semibold text-white">
                  {getAncientInitials(ancient.name)}
                </Text>
              )}
            </Pressable>
          </PointAnnotation>
        ))}
      </MapView>
      {!selectedAncient ? <MapSelectAncientHint /> : null}
      {selectedAncient ? (
        <NativeChatSheet
          ancient={selectedAncient}
          onClose={() => setSelectedAncient(null)}
        />
      ) : null}
    </View>
  );
}

function ChatStubScreen() {
  const { slug } = chatRoute.useParams();
  return <AncientChatScreen slug={slug} />;
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
