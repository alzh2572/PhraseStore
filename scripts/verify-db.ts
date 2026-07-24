import "dotenv/config";
import { createPrismaClient } from "../lib/create-prisma-client";

const prisma = createPrismaClient();

async function main() {
  const email = "test@phrasestore.local";

  const user = await prisma.user.upsert({
    where: { email },
    update: { name: "Test User" },
    create: { email, name: "Test User" },
  });

  const category = await prisma.category.upsert({
    where: { id: "seed-category-quotes" },
    update: { category: "Цитаты" },
    create: { id: "seed-category-quotes", category: "Цитаты" },
  });

  let phrase = await prisma.phrase.findFirst({
    where: { ownerId: user.id, title: "Тестовый промт" },
  });

  if (!phrase) {
    phrase = await prisma.phrase.create({
      data: {
        title: "Тестовый промт",
        content: "Короткий тестовый текст фразы/цитаты.",
        description: "Создано скриптом db:verify",
        visibility: "PUBLIC",
        publishedAt: new Date(),
        ownerId: user.id,
        categoryId: category.id,
      },
    });
  }

  const vote = await prisma.vote.upsert({
    where: {
      userId_phraseId: { userId: user.id, phraseId: phrase.id },
    },
    update: { value: 1 },
    create: {
      userId: user.id,
      phraseId: phrase.id,
      value: 1,
    },
  });

  console.log("OK");
  console.log({
    user: { id: user.id, email: user.email },
    phrase: {
      id: phrase.id,
      title: phrase.title,
      visibility: phrase.visibility,
    },
    vote: { id: vote.id, value: vote.value },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
