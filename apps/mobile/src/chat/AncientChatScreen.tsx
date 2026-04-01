import { AssistantChatTransport, useChatRuntime } from "@assistant-ui/react-ai-sdk";
import {
  AssistantRuntimeProvider,
  ComposerPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
} from "@assistant-ui/react-native";
import { useMemo } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import type { UIMessage } from "ai";
import { useAncient } from "../api/ancients";
import { getApiBaseUrl, useChatHydration } from "./useChatHydration";
import { SendHorizontal } from "lucide-react";

const UserMessage = () => (
  <MessagePrimitive.Root className="mb-3 max-w-[90%] self-end rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2">
    <MessagePrimitive.Content />
  </MessagePrimitive.Root>
);

const AssistantMessage = () => (
  <MessagePrimitive.Root className="mb-3 max-w-[90%] self-start rounded-xl border border-slate-200 bg-white px-3 py-2">
    <MessagePrimitive.Content />
  </MessagePrimitive.Root>
);

export function NativeChatThread({
  slug,
  clientId,
  initialMessages,
}: {
  slug: string;
  clientId: string;
  initialMessages: UIMessage[];
}) {
  const transport = useMemo(
    () =>
      new AssistantChatTransport({
        api: `${getApiBaseUrl()}/api/chat`,
        body: { slug, clientId },
      }),
    [slug, clientId],
  );

  const runtime = useChatRuntime({
    id: `ancient-chat-${slug}-${clientId}`,
    messages: initialMessages,
    transport,
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <ThreadPrimitive.Root className="flex-1">
        <ThreadPrimitive.Messages
          className="flex-1 px-4"
          contentContainerStyle={{ flexGrow: 1, paddingVertical: 14 }}
          components={{
            UserMessage,
            AssistantMessage,
          }}
        />
        <ComposerPrimitive.Root className="flex-row items-end gap-2 border-t border-slate-200 bg-white/95 px-4 py-3">
          <ComposerPrimitive.Input
            className="max-h-32 min-h-10 flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 font-body text-slate-900"
            placeholder="Ask Anything..."
            placeholderTextColor="#94a3b8"
            multiline
          />
          <ComposerPrimitive.Send className="rounded-xl bg-zinc-900 px-4 py-3">
            {/* <Text className="font-body text-sm font-semibold text-zinc-100">Send</Text> */}
            <SendHorizontal />
          </ComposerPrimitive.Send>
        </ComposerPrimitive.Root>
      </ThreadPrimitive.Root>
    </AssistantRuntimeProvider>
  );
}

export function AncientChatScreen({ slug }: { slug: string }) {
  const ancientQuery = useAncient(slug);
  const { hydration, startNewChat } = useChatHydration(slug);

  return (
    <View className="flex-1 bg-background px-2 pb-2 pt-6">
      <View className="flex-row items-start justify-between px-2 pr-1">
        <Text className="font-display flex-1 text-3xl text-textPrimary">
          {ancientQuery.data?.name ?? "Ancient Chat"}
        </Text>
        <Pressable
          accessibilityLabel="New chat"
          accessibilityRole="button"
          disabled={hydration.status !== "ready"}
          className="mt-1 h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white"
          style={{ opacity: hydration.status === "ready" ? 1 : 0.45 }}
          onPress={() => {
            void startNewChat();
          }}
        >
          <Text className="font-body text-2xl font-medium leading-none text-zinc-900">+</Text>
        </Pressable>
      </View>
      <Text className="mb-2 px-2 font-body text-sm text-textSecondary">Slug: {slug}</Text>

      {ancientQuery.isError ? (
        <Text className="mb-2 px-2 font-body text-sm text-red-700">{ancientQuery.error.message}</Text>
      ) : null}

      {hydration.status === "loading" ? (
        <View className="flex-1 items-center justify-center gap-2">
          <ActivityIndicator color="#111827" />
          <Text className="font-body text-sm text-textSecondary">Loading conversation...</Text>
        </View>
      ) : null}

      {hydration.status === "error" ? (
        <Text className="px-2 font-body text-sm text-red-700">{hydration.message}</Text>
      ) : null}

      {hydration.status === "ready" ? (
        <NativeChatThread
          key={`${slug}-${hydration.clientId}`}
          slug={slug}
          clientId={hydration.clientId}
          initialMessages={hydration.initialMessages}
        />
      ) : null}
    </View>
  );
}
