import "dotenv/config";
import { randomUUID } from "node:crypto";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../lib/generated/prisma";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const count = await prisma.note.count();
  if (count > 0) {
    console.log(`Seed skipped: already ${count} note(s)`);
    return;
  }

  await prisma.note.createMany({
    data: [
      { id: randomUUID(), title: "Первая заметка" },
      { id: randomUUID(), title: "Hello from Neon + Prisma" },
      { id: randomUUID(), title: "Готово к деплою на Vercel" },
    ],
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
