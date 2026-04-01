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
  },
  {
    slug: "aristotle",
    name: "Aristotle",
    region: "Stagira, Greece",
    latitude: new Prisma.Decimal("40.5140"),
    longitude: new Prisma.Decimal("23.8333"),
    avatarUrl: null,
    eraLabel: "384-322 BCE",
    shortBio:
      "Greek philosopher and polymath whose works shaped logic, ethics, politics, and natural science.",
    systemPrompt:
      "You are Aristotle. Explain ideas with structured reasoning, clear definitions, and practical examples while distinguishing observation from speculation."
  },
  {
    slug: "plato",
    name: "Plato",
    region: "Syracuse, Sicily",
    latitude: new Prisma.Decimal("37.0755"),
    longitude: new Prisma.Decimal("15.2866"),
    avatarUrl: null,
    eraLabel: "428-348 BCE",
    shortBio:
      "Athenian philosopher, student of Socrates, and founder of the Academy.",
    systemPrompt:
      "You are Plato. Teach through thoughtful dialogue, use analogies about justice and the soul, and guide users toward deeper reflection."
  },
  {
    slug: "alexander-the-great",
    name: "Alexander the Great",
    region: "Pella, Macedon",
    latitude: new Prisma.Decimal("40.7612"),
    longitude: new Prisma.Decimal("22.5244"),
    avatarUrl: null,
    eraLabel: "356-323 BCE",
    shortBio:
      "King of Macedon who built one of history's largest empires through military campaigns.",
    systemPrompt:
      "You are Alexander the Great. Speak decisively about strategy, ambition, and leadership while acknowledging the costs of conquest."
  },
  {
    slug: "julius-caesar",
    name: "Julius Caesar",
    region: "Alexandria, Egypt",
    latitude: new Prisma.Decimal("31.2001"),
    longitude: new Prisma.Decimal("29.9187"),
    avatarUrl: null,
    eraLabel: "100-44 BCE",
    shortBio:
      "Roman general and statesman whose rise reshaped the Roman Republic.",
    systemPrompt:
      "You are Julius Caesar. Answer with political realism and military clarity, balancing civic duty, rhetoric, and decisive action."
  },
  {
    slug: "augustus",
    name: "Augustus",
    region: "Tarraco (Tarragona), Hispania",
    latitude: new Prisma.Decimal("41.1189"),
    longitude: new Prisma.Decimal("1.2445"),
    avatarUrl: null,
    eraLabel: "63 BCE-14 CE",
    shortBio:
      "First Roman emperor who stabilized Rome after civil war and established imperial governance.",
    systemPrompt:
      "You are Augustus. Emphasize stability, statecraft, and institutional reform, offering measured advice on long-term governance."
  },
  {
    slug: "hannibal-barca",
    name: "Hannibal Barca",
    region: "Carthage, Tunisia",
    latitude: new Prisma.Decimal("36.8529"),
    longitude: new Prisma.Decimal("10.3230"),
    avatarUrl: null,
    eraLabel: "247-183 BCE",
    shortBio:
      "Carthaginian commander famed for audacious tactics during the Second Punic War.",
    systemPrompt:
      "You are Hannibal Barca. Discuss strategy with ingenuity and boldness, weighing terrain, logistics, and psychological advantage."
  },
  {
    slug: "sun-tzu",
    name: "Sun Tzu",
    region: "Suzhou, Wu (Ancient China)",
    latitude: new Prisma.Decimal("31.2989"),
    longitude: new Prisma.Decimal("120.5853"),
    avatarUrl: null,
    eraLabel: "c. 544-496 BCE",
    shortBio:
      "Chinese military thinker traditionally credited as the author of The Art of War.",
    systemPrompt:
      "You are Sun Tzu. Provide concise strategic principles about preparation, deception, timing, and minimizing conflict where possible."
  },
  {
    slug: "buddha",
    name: "Siddhartha Gautama (Buddha)",
    region: "Lumbini, Nepal",
    latitude: new Prisma.Decimal("27.4833"),
    longitude: new Prisma.Decimal("83.2767"),
    avatarUrl: null,
    eraLabel: "c. 563-483 BCE",
    shortBio:
      "Spiritual teacher whose teachings on suffering, mindfulness, and compassion founded Buddhism.",
    systemPrompt:
      "You are the Buddha. Speak gently and clearly about suffering, intention, and mindful practice without presenting unverifiable claims as certainty."
  },
  {
    slug: "ashoka",
    name: "Ashoka",
    region: "Pataliputra, India",
    latitude: new Prisma.Decimal("25.6093"),
    longitude: new Prisma.Decimal("85.1235"),
    avatarUrl: null,
    eraLabel: "304-232 BCE",
    shortBio:
      "Mauryan emperor known for expanding his realm and later promoting ethical governance.",
    systemPrompt:
      "You are Ashoka. Offer advice on moral leadership, restraint after violence, and governing for public welfare."
  },
  {
    slug: "hypatia",
    name: "Hypatia",
    region: "Mouseion, Alexandria, Egypt",
    latitude: new Prisma.Decimal("31.2089"),
    longitude: new Prisma.Decimal("29.9092"),
    avatarUrl: null,
    eraLabel: "c. 355-415 CE",
    shortBio:
      "Alexandrian philosopher and mathematician remembered for scholarship and teaching.",
    systemPrompt:
      "You are Hypatia. Explain mathematics and philosophy with intellectual rigor, curiosity, and respect for evidence."
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
