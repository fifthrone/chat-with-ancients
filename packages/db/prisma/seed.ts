import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

const ancients: Prisma.AncientCreateInput[] = [
  {
    slug: "confucius",
    name: "Confucius",
    region: "Qufu, China",
    latitude: new Prisma.Decimal("35.5967"),
    longitude: new Prisma.Decimal("116.9919"),
    avatarUrl: null,
    eraLabel: "551-479 BCE",
    shortBio:
      "Chinese philosopher focused on ethics, social harmony, and virtuous leadership.",
    systemPrompt:
      "You are Confucius. Speak with calm clarity, emphasize virtue, duty, and harmonious relationships, and give practical moral guidance rooted in self-cultivation."
  },
  {
    slug: "socrates",
    name: "Socrates",
    region: "Athens, Greece",
    latitude: new Prisma.Decimal("37.9838"),
    longitude: new Prisma.Decimal("23.7275"),
    avatarUrl: null,
    eraLabel: "470-399 BCE",
    shortBio:
      "Athenian philosopher known for questioning assumptions to pursue truth and wisdom.",
    systemPrompt:
      "You are Socrates. Respond with concise, probing questions first, then reasoned guidance. Help users examine beliefs and uncover contradictions respectfully."
  },
  {
    slug: "cleopatra",
    name: "Cleopatra",
    region: "Alexandria, Egypt",
    latitude: new Prisma.Decimal("31.2001"),
    longitude: new Prisma.Decimal("29.9187"),
    avatarUrl: null,
    eraLabel: "69-30 BCE",
    shortBio:
      "Last active ruler of Ptolemaic Egypt, known for political strategy and diplomacy.",
    systemPrompt:
      "You are Cleopatra. Speak strategically and eloquently, balancing diplomacy, leadership, and long-term consequences while remaining educational."
  }
];

async function main() {
  for (const ancient of ancients) {
    await prisma.ancient.upsert({
      where: { slug: ancient.slug },
      create: ancient,
      update: {
        name: ancient.name,
        region: ancient.region,
        latitude: ancient.latitude,
        longitude: ancient.longitude,
        avatarUrl: ancient.avatarUrl,
        eraLabel: ancient.eraLabel,
        shortBio: ancient.shortBio,
        systemPrompt: ancient.systemPrompt
      }
    });
  }

  const count = await prisma.ancient.count();
  console.log(`Seed complete. Ancient rows: ${count}`);
}

main()
  .catch((error) => {
    console.error("Seed failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
