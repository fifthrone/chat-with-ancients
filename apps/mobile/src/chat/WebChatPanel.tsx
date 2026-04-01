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
import { getAncientInitials, getAncientWebImageUrl } from "./ancientImages";
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
            padding: 14,
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
            borderTop: "1px solid #e5e7eb",
            padding: 12,
            backgroundColor: "rgba(255,255,255,0.72)",
          }}
        >
          <ComposerPrimitive.Input
            placeholder="Message..."
            style={{
              flex: 1,
              borderRadius: 12,
              border: "1px solid #d1d5db",
              padding: "8px 12px",
              fontFamily: "system-ui",
              fontSize: 14,
              color: "#111827",
              backgroundColor: "#ffffff",
              outline: "none",
              resize: "none",
            }}
          />
          <ComposerPrimitive.Send
            style={{
              borderRadius: 12,
              backgroundColor: "#111827",
              padding: "10px 16px",
              border: "none",
              cursor: "pointer",
              fontFamily: "system-ui",
              fontSize: 14,
              fontWeight: 600,
              color: "#ffffff",
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
        backgroundColor: "#111827",
        padding: "8px 12px",
        color: "#ffffff",
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
        backgroundColor: "#ffffff",
        border: "1px solid #e5e7eb",
        padding: "8px 12px",
        color: "#1f2937",
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
  const imageUrl = ancientQuery.data
    ? getAncientWebImageUrl(ancientQuery.data.slug, ancientQuery.data.avatarUrl)
    : null;

  return createElement(
    "div",
    {
      style: {
        width: 400,
        height: "calc(100% - 24px)",
        margin: 12,
        position: "relative" as const,
        display: "flex",
        flexDirection: "column" as const,
        backgroundColor: "rgba(255,255,255,0.56)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        border: "1px solid rgba(255,255,255,0.64)",
        borderRadius: 20,
        boxShadow: "0 10px 28px rgba(17, 24, 39, 0.18)",
        overflow: "hidden",
      },
    },
    createElement(
      "button",
      {
        onClick: onClose,
        style: {
          position: "absolute" as const,
          top: 12,
          right: 12,
          background: "none",
          border: "none",
          color: "#4b5563",
          fontSize: 24,
          cursor: "pointer",
          padding: "4px 8px",
          lineHeight: 1,
          zIndex: 1,
        },
      },
      "\u00D7",
    ),
    createElement(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px 16px 12px",
          borderBottom: "1px solid #e5e7eb",
          backgroundColor: "rgba(255,255,255,0.5)",
        },
      },
      createElement(
        "div",
        {
          style: {
            display: "flex",
            alignItems: "center",
            flexDirection: "column",
            textAlign: "center",
            gap: 8,
            flex: 1,
          },
        },
        imageUrl
          ? createElement("img", {
              src: imageUrl,
              alt: `${ancientQuery.data?.name ?? "Ancient"} avatar`,
              style: {
                width: 120,
                height: 140,
                objectFit: "contain",
              },
            })
          : createElement(
              "div",
              {
                style: {
                  width: 56,
                  height: 56,
                  borderRadius: "9999px",
                  backgroundColor: "#111827",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontFamily: "system-ui",
                  fontSize: 14,
                },
              },
              getAncientInitials(ancientQuery.data?.name ?? "Ancient"),
            ),
        createElement(
          "div",
          {
            style: {
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              minHeight: 56,
              alignItems: "center",
            },
          },
          createElement(
            "h2",
            {
              style: {
                margin: 0,
                fontSize: 20,
                fontWeight: 700,
                color: "#0f172a",
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
                    color: "#475569",
                    fontFamily: "system-ui",
                  },
                },
                ancientQuery.data.eraLabel,
              )
            : null,
          ancientQuery.data?.shortBio
            ? createElement(
                "p",
                {
                  style: {
                    margin: "6px 0 0",
                    fontSize: 13,
                    lineHeight: 1.35,
                    color: "#64748b",
                    fontFamily: "system-ui",
                    maxWidth: 280,
                    textAlign: "center",
                  },
                },
                ancientQuery.data.shortBio,
              )
            : null,
        ),
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
              color: "#64748b",
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
