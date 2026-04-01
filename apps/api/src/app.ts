import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import cors from "cors";
import express from "express";
import { signChatSessionToken } from "./auth/chat-jwt";
import { prisma } from "./db";
import { env } from "./env";
import {
  type ChatAuthedRequest,
  createChatAuthMiddleware,
} from "./middleware/chat-auth";
import {
  chatPostBodySchema,
  chatSessionBodySchema,
  conversationQuerySchema,
} from "./schemas/chat";

const google = createGoogleGenerativeAI({
  apiKey: env.GEMINI_API_KEY,
});
const chatModel = google("gemini-2.5-flash");
const requireChatAuth = createChatAuthMiddleware(env);

const ancientSelect = {
  id: true,
  slug: true,
  name: true,
  region: true,
  latitude: true,
  longitude: true,
  avatarUrl: true,
  eraLabel: true,
  shortBio: true,
  systemPrompt: true,
} as const;

const toAncientResponse = (ancient: {
  id: number;
  slug: string;
  name: string;
  region: string;
  latitude: { toNumber(): number };
  longitude: { toNumber(): number };
  avatarUrl: string | null;
  eraLabel: string;
  shortBio: string;
  systemPrompt: string;
}) => ({
  id: ancient.id,
  slug: ancient.slug,
  name: ancient.name,
  region: ancient.region,
  latitude: ancient.latitude.toNumber(),
  longitude: ancient.longitude.toNumber(),
  avatarUrl: ancient.avatarUrl,
  eraLabel: ancient.eraLabel,
  shortBio: ancient.shortBio,
  systemPrompt: ancient.systemPrompt,
});

const textFromUIMessage = (message: UIMessage) =>
  message.parts
    .filter(
      (part): part is { type: "text"; text: string } => part.type === "text",
    )
    .map((part) => part.text)
    .join("");

const getLatestUserTextFromUIMessages = (
  messages: UIMessage[],
): string | null => {
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    if (message.role !== "user") continue;
    const text = textFromUIMessage(message).trim();
    if (text) return text;
  }
  return null;
};

const composeSystemPrompt = (ancient: {
  name: string;
  eraLabel: string;
  region: string;
  systemPrompt: string;
}) =>
  [
    `You are ${ancient.name}, speaking as an educational historical roleplay assistant.`,
    `Era: ${ancient.eraLabel}. Region: ${ancient.region}.`,
    ancient.systemPrompt,
    "Stay in character while remaining historically grounded.",
    "If uncertain, clearly state uncertainty instead of fabricating facts.",
    "Do not provide harmful instructions.",
  ].join("\n");

const getConversationForAncient = async (slug: string, clientId: string) => {
  const ancient = await prisma.ancient.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
      eraLabel: true,
      region: true,
      systemPrompt: true,
    },
  });

  if (!ancient) return null;

  const conversation = await prisma.conversation.upsert({
    where: {
      clientId_ancientId: {
        clientId,
        ancientId: ancient.id,
      },
    },
    update: {},
    create: {
      clientId,
      ancientId: ancient.id,
    },
    select: {
      id: true,
      clientId: true,
      ancientId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return { ancient, conversation };
};

export function createApp() {
  const app = express();

  app.use(express.json());
  app.use(
    cors({
      origin: env.CORS_ORIGINS.includes("*") ? true : env.CORS_ORIGINS,
    }),
  );

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/ancients", async (_req, res) => {
    const ancients = await prisma.ancient.findMany({
      select: ancientSelect,
      orderBy: { name: "asc" },
    });

    res.json(ancients.map(toAncientResponse));
  });

  app.get("/ancients/:slug", async (req, res) => {
    const ancient = await prisma.ancient.findUnique({
      where: { slug: req.params.slug },
      select: ancientSelect,
    });

    if (!ancient) {
      res.status(404).json({ error: "Ancient not found" });
      return;
    }

    res.json(toAncientResponse(ancient));
  });

  app.post("/auth/chat-session", async (req, res) => {
    const parsed = chatSessionBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid request body",
        details: parsed.error.flatten(),
      });
      return;
    }

    const expiresInSeconds = 60 * 60 * 24 * 7;
    const token = await signChatSessionToken(
      env.CHAT_SESSION_SECRET,
      parsed.data.clientId,
      expiresInSeconds,
    );

    res.json({ token, expiresIn: expiresInSeconds });
  });

  app.get("/chat/conversation", requireChatAuth, async (req, res) => {
    const parsed = conversationQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid query parameters",
        details: parsed.error.flatten(),
      });
      return;
    }

    const slug = parsed.data.slug;
    const clientId = (req as ChatAuthedRequest).chatClientId;

    const scoped = await getConversationForAncient(slug, clientId);
    if (!scoped) {
      res.status(404).json({ error: "Ancient not found" });
      return;
    }

    const rows = await prisma.message.findMany({
      where: { conversationId: scoped.conversation.id },
      orderBy: { createdAt: "desc" },
      take: env.CHAT_HISTORY_LIMIT,
      select: {
        id: true,
        role: true,
        content: true,
        createdAt: true,
      },
    });

    const messages = [...rows].reverse();

    res.json({
      conversation: scoped.conversation,
      ancient: scoped.ancient,
      messages,
    });
  });

  app.post("/api/chat", requireChatAuth, async (req, res) => {
    const parsed = chatPostBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "Invalid request body",
        details: parsed.error.flatten(),
      });
      return;
    }

    if (!env.GEMINI_API_KEY) {
      res
        .status(500)
        .json({ error: "GEMINI_API_KEY is not configured on the server" });
      return;
    }

    const slug = parsed.data.slug;
    const clientId = (req as ChatAuthedRequest).chatClientId;
    const messages = parsed.data.messages as unknown as UIMessage[];

    if (messages.length === 0) {
      res
        .status(400)
        .json({ error: "messages must contain at least one valid message" });
      return;
    }

    const latestUserText = getLatestUserTextFromUIMessages(messages);
    if (!latestUserText) {
      res.status(400).json({
        error: "messages must include at least one user message with text",
      });
      return;
    }

    const scoped = await getConversationForAncient(slug, clientId);
    if (!scoped) {
      res.status(404).json({ error: "Ancient not found" });
      return;
    }

    await prisma.message.create({
      data: {
        conversationId: scoped.conversation.id,
        role: "user",
        content: latestUserText,
      },
    });

    try {
      const modelMessages = await convertToModelMessages(
        messages.map(({ id: _id, ...rest }) => rest),
      );

      const result = streamText({
        model: chatModel,
        system: composeSystemPrompt(scoped.ancient),
        messages: modelMessages,
      });

      result.pipeUIMessageStreamToResponse(res, {
        originalMessages: messages,
        headers: {
          "X-Conversation-Id": scoped.conversation.id.toString(),
        },
        onFinish: async ({ responseMessage }) => {
          const assistantText = textFromUIMessage(responseMessage).trim();
          if (!assistantText) return;
          await prisma.message.create({
            data: {
              conversationId: scoped.conversation.id,
              role: "assistant",
              content: assistantText,
            },
          });
        },
      });
    } catch (error) {
      console.error("Failed to stream chat completion", error);
      if (!res.headersSent) {
        res
          .status(500)
          .json({ error: "Failed to generate assistant response" });
        return;
      }
      res.end();
    }
  });

  app.use(
    (
      error: unknown,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      console.error("API error", error);
      res.status(500).json({ error: "Internal server error" });
    },
  );

  return app;
}
