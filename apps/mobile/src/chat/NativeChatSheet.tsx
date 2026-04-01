import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Pressable,
  Text,
  View,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import type { Ancient } from "../api/ancients";
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
  const hydration = useChatHydration(ancient.slug);

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
            backgroundColor: "rgba(0,0,0,0.5)",
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
          left: 0,
          right: 0,
          height: SCREEN_HEIGHT,
          transform: [{ translateY }],
          backgroundColor: "#0b1020",
          borderTopLeftRadius: expanded ? 0 : 20,
          borderTopRightRadius: expanded ? 0 : 20,
        }}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          {!expanded ? (
            <View className="px-5 pt-4 pb-5">
              <View className="mb-3 h-1 w-10 self-center rounded-full bg-zinc-600" />
              <Text className="font-display text-2xl text-textPrimary">{ancient.name}</Text>
              <Text className="mt-1 font-body text-sm text-textSecondary">{ancient.eraLabel}</Text>
              <Text className="mt-2 font-body text-sm leading-5 text-textSecondary" numberOfLines={3}>
                {ancient.shortBio}
              </Text>
              <Pressable
                className="mt-4 items-center rounded-xl bg-accent py-3"
                onPress={() => setExpanded(true)}
              >
                <Text className="font-body text-sm font-semibold text-background">Chat</Text>
              </Pressable>
            </View>
          ) : (
            <View className="flex-1 pt-12">
              <View className="flex-row items-center justify-between px-4 pb-3 border-b border-zinc-800">
                <View className="flex-1">
                  <Text className="font-display text-xl text-textPrimary">{ancient.name}</Text>
                  <Text className="font-body text-xs text-textSecondary">{ancient.eraLabel}</Text>
                </View>
                <Pressable
                  className="rounded-lg bg-surface px-3 py-2"
                  onPress={handleClose}
                >
                  <Text className="font-body text-sm text-textSecondary">Close</Text>
                </Pressable>
              </View>

              <View className="flex-1">
                {hydration.status === "loading" ? (
                  <View className="flex-1 items-center justify-center gap-2">
                    <ActivityIndicator />
                    <Text className="font-body text-sm text-textSecondary">
                      Loading conversation...
                    </Text>
                  </View>
                ) : hydration.status === "error" ? (
                  <Text className="px-4 pt-4 font-body text-sm text-red-300">
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
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
}
