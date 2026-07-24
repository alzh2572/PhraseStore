import "dotenv/config";
import { createPrismaClient } from "../lib/create-prisma-client";

const prisma = createPrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { email: "seed@phrasestore.local" },
    update: {},
    create: { email: "seed@phrasestore.local", name: "Seed User" },
  });

  const noteCount = await prisma.note.count();
  if (noteCount === 0) {
    await prisma.note.createMany({
      data: [
        { title: "Первая заметка", ownerId: user.id },
        { title: "Hello from Neon + Prisma", ownerId: user.id },
        { title: "Готово к деплою на Vercel", ownerId: user.id },
      ],
    });
    console.log("Seeded 3 notes");
  } else {
    console.log(`Seed skipped: already ${noteCount} note(s)`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
