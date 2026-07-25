import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PhrasesWorkspace } from "@/components/dashboard/PhrasesWorkspace";
import { listPhrasesForDashboard } from "@/lib/phrases";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ q?: string; page?: string }>;
};

export default async function PublicPhrasesPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const params = await searchParams;
  const page = Number(params.page ?? "1") || 1;
  const q = params.q?.trim() || undefined;

  const result = await listPhrasesForDashboard({
    mode: "public",
    userId: session.user.id,
    page,
    q,
  });

  return (
    <PhrasesWorkspace
      title="Публичные фразы/цитаты"
      subtitle="Все фразы с isPublic = true. Свои можно править и удалять."
      basePath="/dashboard/public"
      currentUserId={session.user.id}
      phrases={result.items.map((p) => ({
        id: p.id,
        title: p.title,
        content: p.content,
        isPublic: p.isPublic,
        isFavorite: p.isFavorite,
        createdAt: p.createdAt,
        ownerId: p.ownerId,
        voteCount: p._count.votes,
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
