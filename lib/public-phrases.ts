import { prisma } from "@/lib/prisma";

const HOME_TAKE = 12;

export type PublicPhraseCard = {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  likesCount: number;
  likedByMe: boolean;
  authorName: string;
  tags: string[];
};

type PhraseRow = {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  owner: { name: string | null; email: string };
  tags: { tag: { name: string } }[];
  _count: { likes: number };
};

function mapRows(
  rows: PhraseRow[],
  likedIds: Set<string>
): PublicPhraseCard[] {
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    content: row.content,
    createdAt: row.createdAt,
    likesCount: row._count.likes,
    likedByMe: likedIds.has(row.id),
    authorName: row.owner.name?.trim() || row.owner.email.split("@")[0] || "Автор",
    tags: row.tags.map((t) => t.tag.name),
  }));
}

const phraseSelect = {
  id: true,
  title: true,
  content: true,
  createdAt: true,
  owner: { select: { name: true, email: true } },
  tags: { select: { tag: { select: { name: true } } } },
  _count: { select: { likes: true } },
} as const;

/**
 * Две выборки для главной: новые и популярные PUBLIC-фразы.
 * likedByMe — одним запросом Like по объединённым phraseIds.
 */
export async function getHomePublicPhrases(userId?: string | null) {
  const [recentRows, popularRows] = await Promise.all([
    prisma.phrase.findMany({
      where: { isPublic: true },
      orderBy: { createdAt: "desc" },
      take: HOME_TAKE,
      select: phraseSelect,
    }),
    prisma.phrase.findMany({
      where: { isPublic: true },
      orderBy: [{ likes: { _count: "desc" } }, { createdAt: "desc" }],
      take: HOME_TAKE,
      select: phraseSelect,
    }),
  ]);

  const likedIds = await loadLikedSet(
    userId,
    [...recentRows, ...popularRows].map((p) => p.id)
  );

  return {
    recent: mapRows(recentRows, likedIds),
    popular: mapRows(popularRows, likedIds),
  };
}

/** Каталог публичных фраз с пагинацией. */
export async function listCatalogPhrases(options: {
  userId?: string | null;
  page?: number;
  pageSize?: number;
}) {
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.min(40, Math.max(1, options.pageSize ?? 20));
  const where = { isPublic: true };

  const [total, rows] = await Promise.all([
    prisma.phrase.count({ where }),
    prisma.phrase.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: phraseSelect,
    }),
  ]);

  const likedIds = await loadLikedSet(
    options.userId,
    rows.map((p) => p.id)
  );

  return {
    items: mapRows(rows, likedIds),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getPublicPhraseById(
  id: string,
  userId?: string | null
) {
  const phrase = await prisma.phrase.findUnique({
    where: { id },
    select: {
      ...phraseSelect,
      isPublic: true,
      ownerId: true,
      updatedAt: true,
    },
  });

  if (!phrase) return null;

  // Публичные видят все; приватные — только владелец
  if (!phrase.isPublic && phrase.ownerId !== userId) {
    return null;
  }

  const likedIds = phrase.isPublic
    ? await loadLikedSet(userId, [phrase.id])
    : new Set<string>();

  return {
    ...mapRows([phrase], likedIds)[0],
    isPublic: phrase.isPublic,
    ownerId: phrase.ownerId,
    updatedAt: phrase.updatedAt,
  };
}

async function loadLikedSet(
  userId: string | null | undefined,
  phraseIds: string[]
): Promise<Set<string>> {
  const uniqueIds = [...new Set(phraseIds)];
  if (!userId || uniqueIds.length === 0) return new Set();

  const likes = await prisma.like.findMany({
    where: {
      userId,
      phraseId: { in: uniqueIds },
    },
    select: { phraseId: true },
  });

  return new Set(likes.map((l) => l.phraseId));
}
