import { AssistantChatTransport, useChatRuntime } from "@assistant-ui/react-ai-sdk";
import {
  AssistantRuntimeProvider,
  ComposerPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
} from "@assistant-ui/react";
import { createElement, useMemo } from "react";
import type { UIMessage } from "ai";
import { useAncient } from "../api/ancients";
import { getApiBaseUrl, useChatHydration } from "./useChatHydration";

function WebChatThread({
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
      <ThreadPrimitive.Root
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minHeight: 0,
        }}
      >
        <ThreadPrimitive.Viewport
          style={{
            flex: 1,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <ThreadPrimitive.Messages
            components={{
              UserMessage: WebUserMessage,
              AssistantMessage: WebAssistantMessage,
            }}
          />
        </ThreadPrimitive.Viewport>

        <ComposerPrimitive.Root
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 8,
            borderTop: "1px solid #3f3f46",
            padding: 12,
          }}
        >
          <ComposerPrimitive.Input
            placeholder="Message..."
            style={{
              flex: 1,
              minHeight: 40,
              maxHeight: 128,
              borderRadius: 12,
              border: "1px solid #3f3f46",
              padding: "8px 12px",
              fontFamily: "system-ui",
              fontSize: 14,
              color: "#ecf0ff",
              backgroundColor: "transparent",
              outline: "none",
              resize: "none",
            }}
          />
          <ComposerPrimitive.Send
            style={{
              borderRadius: 12,
              backgroundColor: "#7c9dff",
              padding: "10px 16px",
              border: "none",
              cursor: "pointer",
              fontFamily: "system-ui",
              fontSize: 14,
              fontWeight: 600,
              color: "#0b1020",
            }}
          >
            Send
          </ComposerPrimitive.Send>
        </ComposerPrimitive.Root>
      </ThreadPrimitive.Root>
    </AssistantRuntimeProvider>
  );
}

function WebUserMessage() {
  return (
    <MessagePrimitive.Root
      style={{
        marginBottom: 12,
        maxWidth: "85%",
        alignSelf: "flex-end",
        borderRadius: 12,
        backgroundColor: "#7c9dff",
        padding: "8px 12px",
        color: "#0b1020",
        fontSize: 14,
        fontFamily: "system-ui",
        lineHeight: 1.5,
      }}
    >
      <MessagePrimitive.Content />
    </MessagePrimitive.Root>
  );
}

function WebAssistantMessage() {
  return (
    <MessagePrimitive.Root
      style={{
        marginBottom: 12,
        maxWidth: "85%",
        alignSelf: "flex-start",
        borderRadius: 12,
        backgroundColor: "#27272a",
        padding: "8px 12px",
        color: "#ecf0ff",
        fontSize: 14,
        fontFamily: "system-ui",
        lineHeight: 1.5,
      }}
    >
      <MessagePrimitive.Content />
    </MessagePrimitive.Root>
  );
}

export function WebChatPanel({
  slug,
  onClose,
}: {
  slug: string;
  onClose: () => void;
}) {
  const ancientQuery = useAncient(slug);
  const hydration = useChatHydration(slug);

  return createElement(
    "div",
    {
      style: {
        width: 400,
        height: "100%",
        display: "flex",
        flexDirection: "column" as const,
        backgroundColor: "#0b1020",
        borderLeft: "1px solid #1e293b",
      },
    },
    createElement(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 16px 12px",
          borderBottom: "1px solid #1e293b",
        },
      },
      createElement(
        "div",
        null,
        createElement(
          "h2",
          {
            style: {
              margin: 0,
              fontSize: 20,
              fontWeight: 700,
              color: "#ecf0ff",
              fontFamily: "system-ui",
            },
          },
          ancientQuery.data?.name ?? "Loading...",
        ),
        ancientQuery.data?.eraLabel
          ? createElement(
              "p",
              {
                style: {
                  margin: "4px 0 0",
                  fontSize: 12,
                  color: "#9faecd",
                  fontFamily: "system-ui",
                },
              },
              ancientQuery.data.eraLabel,
            )
          : null,
      ),
      createElement(
        "button",
        {
          onClick: onClose,
          style: {
            background: "none",
            border: "none",
            color: "#9faecd",
            fontSize: 24,
            cursor: "pointer",
            padding: "4px 8px",
            lineHeight: 1,
          },
        },
        "\u00D7",
      ),
    ),
    hydration.status === "loading"
      ? createElement(
          "div",
          {
            style: {
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#9faecd",
              fontFamily: "system-ui",
              fontSize: 14,
            },
          },
          "Loading conversation...",
        )
      : hydration.status === "error"
        ? createElement(
            "div",
            {
              style: {
                padding: 16,
                color: "#fca5a5",
                fontFamily: "system-ui",
                fontSize: 14,
              },
            },
            hydration.message,
          )
        : createElement(WebChatThread, {
            key: `${slug}-${hydration.clientId}`,
            slug,
            clientId: hydration.clientId,
            initialMessages: hydration.initialMessages,
          }),
  );
}
