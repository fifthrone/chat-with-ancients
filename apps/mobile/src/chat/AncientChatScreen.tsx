import { AssistantChatTransport, useChatRuntime } from "@assistant-ui/react-ai-sdk";
import {
  AssistantRuntimeProvider,
  ComposerPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
} from "@assistant-ui/react-native";
import { useMemo } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import type { UIMessage } from "ai";
import { useAncient } from "../api/ancients";
import { getApiBaseUrl, useChatHydration } from "./useChatHydration";

const UserMessage = () => (
  <MessagePrimitive.Root className="mb-3 max-w-[90%] self-end rounded-lg bg-accent px-3 py-2">
    <MessagePrimitive.Content />
  </MessagePrimitive.Root>
);

const AssistantMessage = () => (
  <MessagePrimitive.Root className="mb-3 max-w-[90%] self-start rounded-lg bg-zinc-800 px-3 py-2">
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
          className="flex-1 px-3"
          contentContainerStyle={{ flexGrow: 1, paddingVertical: 8 }}
          components={{
            UserMessage,
            AssistantMessage,
          }}
        />
        <ComposerPrimitive.Root className="flex-row items-end gap-2 border-t border-zinc-700 px-3 py-3">
          <ComposerPrimitive.Input
            className="max-h-32 min-h-10 flex-1 rounded-xl border border-zinc-700 px-3 py-2 font-body text-textPrimary"
            placeholder="Message..."
            placeholderTextColor="#a1a1aa"
            multiline
          />
          <ComposerPrimitive.Send className="rounded-xl bg-accent px-4 py-3">
            <Text className="font-body text-sm font-semibold text-background">Send</Text>
          </ComposerPrimitive.Send>
        </ComposerPrimitive.Root>
      </ThreadPrimitive.Root>
    </AssistantRuntimeProvider>
  );
}

export function AncientChatScreen({ slug }: { slug: string }) {
  const ancientQuery = useAncient(slug);
  const hydration = useChatHydration(slug);

  return (
    <View className="flex-1 bg-background px-2 pb-2 pt-6">
      <Text className="font-display px-2 text-3xl text-textPrimary">
        {ancientQuery.data?.name ?? "Ancient Chat"}
      </Text>
      <Text className="mb-2 px-2 font-body text-sm text-textSecondary">Slug: {slug}</Text>

      {ancientQuery.isError ? (
        <Text className="mb-2 px-2 font-body text-sm text-red-300">{ancientQuery.error.message}</Text>
      ) : null}

      {hydration.status === "loading" ? (
        <View className="flex-1 items-center justify-center gap-2">
          <ActivityIndicator />
          <Text className="font-body text-sm text-textSecondary">Loading conversation...</Text>
        </View>
      ) : null}

      {hydration.status === "error" ? (
        <Text className="px-2 font-body text-sm text-red-300">{hydration.message}</Text>
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
