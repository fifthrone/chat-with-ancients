import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Pressable,
  SafeAreaView,
  Text,
  View,
  ActivityIndicator,
  KeyboardAvoidingView,
  Image,
  Platform,
} from "react-native";
import { BlurView } from "expo-blur";
import type { Ancient } from "../api/ancients";
import { getAncientImageSource, getAncientInitials } from "./ancientImages";
import { useChatHydration } from "./useChatHydration";
import { NativeChatThread } from "./AncientChatScreen";

const PEEK_HEIGHT = 220;
const SCREEN_HEIGHT = Dimensions.get("window").height;

export function NativeChatSheet({
  ancient,
  onClose,
}: {
  ancient: Ancient;
  onClose: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const { hydration, startNewChat } = useChatHydration(ancient.slug);
  const imageSource = getAncientImageSource(ancient.slug, ancient.avatarUrl);

  const targetY = expanded ? 0 : SCREEN_HEIGHT - PEEK_HEIGHT;

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: targetY,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  }, [targetY, translateY]);

  const handleClose = () => {
    Animated.timing(translateY, {
      toValue: SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => onClose());
  };

  return (
    <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
      {expanded ? (
        <Pressable
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(17,24,39,0.18)",
          }}
          onPress={handleClose}
        />
      ) : (
        <Pressable
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
          onPress={handleClose}
        />
      )}

      <Animated.View
        style={{
          position: "absolute",
          left: 10,
          right: 10,
          top: 10,
          height: SCREEN_HEIGHT,
          transform: [{ translateY }],
          backgroundColor: "transparent",
          borderRadius: 20,
          borderWidth: 1,
          borderColor: "rgba(17,24,39,0.12)",
          shadowColor: "#111827",
          shadowOpacity: 0.1,
          shadowOffset: { width: 0, height: 8 },
          shadowRadius: 18,
          elevation: 8,
          overflow: "hidden",
        }}
      >
        <BlurView intensity={28} tint="light" style={{ flex: 1 }}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <SafeAreaView style={{ flex: 1 }}>
            {!expanded ? (
              <View className="px-5 pt-4 pb-5">
              <View className="mb-3 h-1 w-10 self-center rounded-full bg-zinc-400" />
              {imageSource ? (
                <Image source={imageSource} style={{ width: 56, height: 56, borderRadius: 28 }} />
              ) : (
                <View className="h-14 w-14 items-center justify-center rounded-full bg-zinc-800">
                  <Text className="font-body text-base font-semibold text-white">
                    {getAncientInitials(ancient.name)}
                  </Text>
                </View>
              )}
              <Text className="font-display text-2xl text-textPrimary">{ancient.name}</Text>
              <Text className="mt-1 font-body text-sm text-textSecondary">{ancient.eraLabel}</Text>
              <Text className="mt-2 font-body text-sm leading-5 text-textSecondary" numberOfLines={3}>
                {ancient.shortBio}
              </Text>
              <Pressable
                className="mt-4 items-center rounded-xl bg-zinc-900 py-3"
                onPress={() => setExpanded(true)}
              >
                <Text className="font-body text-sm font-semibold text-white">Chat</Text>
              </Pressable>
              </View>
            ) : (
              <View className="flex-1 pt-2">
                <View
                  style={{
                    alignItems: "center",
                    paddingHorizontal: 16,
                    paddingBottom: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: "#e5e7eb",
                    backgroundColor: "rgba(255,255,255,0.45)",
                    position: "relative",
                  }}
                >
                  <View className="flex-1 items-center">
                  {imageSource ? (
                    <Image source={imageSource} style={{ width: 56, height: 56, borderRadius: 28 }} />
                  ) : (
                    <View className="h-14 w-14 items-center justify-center rounded-full bg-zinc-800">
                      <Text className="font-body text-sm font-semibold text-white">
                        {getAncientInitials(ancient.name)}
                      </Text>
                    </View>
                  )}
                  <View className="mt-2 items-center justify-center">
                    <Text className="font-display text-xl text-zinc-900">{ancient.name}</Text>
                    <Text className="font-body text-xs text-zinc-600">{ancient.eraLabel}</Text>
                    <Text
                      className="mt-1 px-4 text-center font-body text-xs leading-4 text-zinc-500"
                      numberOfLines={2}
                    >
                      {ancient.shortBio}
                    </Text>
                  </View>
                </View>
                <Pressable
                  accessibilityLabel="New chat"
                  accessibilityRole="button"
                  disabled={hydration.status !== "ready"}
                  className="absolute left-4 top-1 rounded-lg bg-white px-3 py-2"
                  style={{ opacity: hydration.status === "ready" ? 1 : 0.45 }}
                  onPress={() => {
                    void startNewChat();
                  }}
                >
                  <Text className="font-body text-xl font-medium leading-none text-zinc-800">+</Text>
                </Pressable>
                <Pressable
                  className="absolute right-4 top-1 rounded-lg bg-white px-3 py-2"
                  onPress={handleClose}
                >
                  <Text className="font-body text-sm text-zinc-600">Close</Text>
                </Pressable>
              </View>

              <View className="flex-1">
                {hydration.status === "loading" ? (
                  <View className="flex-1 items-center justify-center gap-2">
                    <ActivityIndicator color="#111827" />
                    <Text className="font-body text-sm text-textSecondary">
                      Loading conversation...
                    </Text>
                  </View>
                ) : hydration.status === "error" ? (
                  <Text className="px-4 pt-4 font-body text-sm text-red-700">
                    {hydration.message}
                  </Text>
                ) : (
                  <NativeChatThread
                    key={`${ancient.slug}-${hydration.clientId}`}
                    slug={ancient.slug}
                    clientId={hydration.clientId}
                    initialMessages={hydration.initialMessages}
                  />
                )}
              </View>
              </View>
            )}
            </SafeAreaView>
          </KeyboardAvoidingView>
        </BlurView>
      </Animated.View>
    </View>
  );
}
