import { prisma } from "@/lib/prisma";
import type { Visibility } from "@/lib/generated/prisma";

/**
 * Фразы текущего пользователя (включая PRIVATE).
 */
export async function listMyPhrases(userId: string) {
  return prisma.phrase.findMany({
    where: { ownerId: userId },
    orderBy: { updatedAt: "desc" },
    include: {
      category: true,
    },
  });
}

/**
 * Публичные фразы + свои приватные (если viewerId задан).
 */
export async function listVisiblePhrases(viewerId?: string | null) {
  return prisma.phrase.findMany({
    where: viewerId
      ? {
          OR: [
            { visibility: "PUBLIC" },
            { ownerId: viewerId, visibility: "PRIVATE" },
          ],
        }
      : { visibility: "PUBLIC" },
    orderBy: { createdAt: "desc" },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      category: true,
    },
  });
}

/**
 * Одна фраза с проверкой приватности.
 * PRIVATE видит только владелец.
 */
export async function getPhraseForViewer(
  phraseId: string,
  viewerId?: string | null
) {
  const phrase = await prisma.phrase.findUnique({
    where: { id: phraseId },
    include: {
      owner: { select: { id: true, name: true, email: true, image: true } },
      category: true,
    },
  });

  if (!phrase) return null;

  if (phrase.visibility === "PRIVATE" && phrase.ownerId !== viewerId) {
    return null;
  }

  return phrase;
}

export async function createPhraseForUser(input: {
  ownerId: string;
  title: string;
  content: string;
  description?: string;
  categoryId: string;
  visibility?: Visibility;
}) {
  const visibility = input.visibility ?? "PRIVATE";
  return prisma.phrase.create({
    data: {
      title: input.title,
      content: input.content,
      description: input.description,
      categoryId: input.categoryId,
      ownerId: input.ownerId,
      visibility,
      publishedAt: visibility === "PUBLIC" ? new Date() : null,
    },
  });
}
