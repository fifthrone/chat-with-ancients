import cors from "cors";
import express from "express";
import { prisma } from "./db";
import { env } from "./env";

const app = express();
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
