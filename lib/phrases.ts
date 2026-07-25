import { prisma } from "@/lib/prisma";

export type PhraseListMode = "mine" | "public" | "favorites";

const PAGE_SIZE = 10;

export type PhraseListItem = {
  id: string;
  title: string;
  content: string;
  isPublic: boolean;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
  ownerId: string;
  owner: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  _count: { votes: number };
};

/**
 * Список фраз для кабинета с поиском и пагинацией.
 */
export async function listPhrasesForDashboard(options: {
  mode: PhraseListMode;
  userId: string;
  q?: string;
  page?: number;
}): Promise<{
  items: PhraseListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  const page = Math.max(1, options.page ?? 1);
  const q = options.q?.trim() || undefined;

  const search = q
    ? {
        OR: [
          { title: { contains: q, mode: "insensitive" as const } },
          { content: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};

  const where =
    options.mode === "mine"
      ? { ownerId: options.userId, ...search }
      : options.mode === "favorites"
        ? { ownerId: options.userId, isFavorite: true, ...search }
        : { isPublic: true, ...search };

  const [total, items] = await Promise.all([
    prisma.phrase.count({ where }),
    prisma.phrase.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        title: true,
        content: true,
        isPublic: true,
        isFavorite: true,
        createdAt: true,
        updatedAt: true,
        ownerId: true,
        owner: {
          select: { id: true, name: true, email: true, image: true },
        },
        _count: { select: { votes: true } },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return {
    items,
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages,
  };
}

/** @deprecated используйте listPhrasesForDashboard */
export async function listMyPhrases(userId: string) {
  return prisma.phrase.findMany({
    where: { ownerId: userId },
    orderBy: { updatedAt: "desc" },
    include: { category: true },
  });
}

export async function listVisiblePhrases(viewerId?: string | null) {
  return prisma.phrase.findMany({
    where: viewerId
      ? {
          OR: [{ isPublic: true }, { ownerId: viewerId }],
        }
      : { isPublic: true },
    orderBy: { createdAt: "desc" },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      category: true,
    },
  });
}

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
  if (!phrase.isPublic && phrase.ownerId !== viewerId) return null;
  return phrase;
}
