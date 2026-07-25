import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PhrasesWorkspace } from "@/components/dashboard/PhrasesWorkspace";
import {
  listPhrasesForDashboard,
  type PhraseSort,
} from "@/lib/phrases";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ q?: string; page?: string; sort?: string }>;
};

function parseSort(value: string | undefined): PhraseSort {
  return value === "popular" ? "popular" : "recent";
}

export default async function PublicPhrasesPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const params = await searchParams;
  const page = Number(params.page ?? "1") || 1;
  const q = params.q?.trim() || undefined;
  const sort = parseSort(params.sort);

  const result = await listPhrasesForDashboard({
    mode: "public",
    userId: session.user.id,
    page,
    q,
    sort,
  });

  return (
    <PhrasesWorkspace
      title="Публичные фразы/цитаты"
      subtitle="Все публичные фразы. Лайк — один на пользователя (повторно снимает)."
      basePath="/dashboard/public"
      currentUserId={session.user.id}
      showLike
      showSort
      sort={result.sort}
      phrases={result.items.map((p) => ({
        id: p.id,
        title: p.title,
        content: p.content,
        isPublic: p.isPublic,
        isFavorite: p.isFavorite,
        createdAt: p.createdAt,
        ownerId: p.ownerId,
        voteCount: p._count.votes,
        likesCount: p._count.likes,
        likedByMe: p.likedByMe,
      }))}
      page={result.page}
      totalPages={result.totalPages}
      total={result.total}
      q={q}
      emptyTitle="Пока нет публичных фраз"
      emptyDescription="Сделайте одну из своих фраз публичной — она появится здесь."
    />
  );
}
