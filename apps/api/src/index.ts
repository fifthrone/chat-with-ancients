import cors from "cors";
import express from "express";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { prisma } from "./db";
import { env } from "./env";

const app = express();
const google = createGoogleGenerativeAI({
  apiKey: env.GEMINI_API_KEY,
});
const chatModel = google("gemini-2.5-flash");
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

const textFromUIMessage = (message: UIMessage) =>
  message.parts
    .filter((part): part is { type: "text"; text: string } => part.type === "text")
    .map((part) => part.text)
    .join("");

const getLatestUserTextFromUIMessages = (messages: UIMessage[]): string | null => {
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    if (message.role !== "user") continue;
    const text = textFromUIMessage(message).trim();
    if (text) return text;
  }
  return null;
};

const composeSystemPrompt = (ancient: { name: string; eraLabel: string; region: string; systemPrompt: string }) =>
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

app.get("/chat/conversation", async (req, res) => {
  const slug = typeof req.query.slug === "string" ? req.query.slug.trim() : "";
  const clientId = typeof req.query.clientId === "string" ? req.query.clientId.trim() : "";

  if (!slug || !clientId) {
    res.status(400).json({ error: "slug and clientId are required" });
    return;
  }

  const scoped = await getConversationForAncient(slug, clientId);
  if (!scoped) {
    res.status(404).json({ error: "Ancient not found" });
    return;
  }

  const messages = await prisma.message.findMany({
    where: { conversationId: scoped.conversation.id },
    orderBy: { createdAt: "asc" },
    take: env.CHAT_HISTORY_LIMIT,
    select: {
      id: true,
      role: true,
      content: true,
      createdAt: true,
    },
  });

  res.json({
    conversation: scoped.conversation,
    ancient: scoped.ancient,
    messages,
  });
});

app.post("/api/chat", async (req, res) => {
  const slug = typeof req.body?.slug === "string" ? req.body.slug.trim() : "";
  const clientId = typeof req.body?.clientId === "string" ? req.body.clientId.trim() : "";
  const messages = Array.isArray(req.body?.messages) ? (req.body.messages as UIMessage[]) : [];

  if (!env.GEMINI_API_KEY) {
    res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server" });
    return;
  }

  if (!slug || !clientId) {
    res.status(400).json({ error: "slug and clientId are required" });
    return;
  }

  if (messages.length === 0) {
    res.status(400).json({ error: "messages must contain at least one valid message" });
    return;
  }

  const latestUserText = getLatestUserTextFromUIMessages(messages);
  if (!latestUserText) {
    res.status(400).json({ error: "messages must include at least one user message with text" });
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
      res.status(500).json({ error: "Failed to generate assistant response" });
      return;
    }
    res.end();
  }
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("API error", error);
  res.status(500).json({ error: "Internal server error" });
});

const server = app.listen(env.PORT, () => {
  console.log(`API listening on http://localhost:${env.PORT}`);
});

const shutdown = async () => {
  await prisma.$disconnect();
  server.close(() => process.exit(0));
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
