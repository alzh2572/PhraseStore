import "dotenv/config";
import { randomUUID } from "node:crypto";
import { createPrismaClient } from "../lib/create-prisma-client";

const prisma = createPrismaClient();

async function main() {
  const count = await prisma.note.count();
  if (count > 0) {
    console.log(`Seed skipped: already ${count} note(s)`);
    return;
  }

  await prisma.note.create({
    data: { id: randomUUID(), title: "Первая заметка" },
  });
  await prisma.note.create({
    data: { id: randomUUID(), title: "Hello from Neon + Prisma" },
  });
  await prisma.note.create({
    data: { id: randomUUID(), title: "Готово к деплою на Vercel" },
  });

  console.log("Seeded 3 notes");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
