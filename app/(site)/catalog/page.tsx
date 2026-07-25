import Link from "next/link";
import { auth } from "@/auth";
import { PublicPhraseCard } from "@/components/home/PublicPhraseCard";
import { listCatalogPhrases } from "@/lib/public-phrases";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ page?: string }>;
};

export default async function CatalogPage({ searchParams }: Props) {
  const session = await auth();
  const isLoggedIn = Boolean(session?.user?.id);
  const params = await searchParams;
  const page = Number(params.page ?? "1") || 1;

  const result = await listCatalogPhrases({
    userId: session?.user?.id,
    page,
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Каталог</h1>
        <p className="mt-2 text-muted">
          Все публичные фразы и цитаты. Редактирование — только в кабинете.
        </p>
      </header>

      {result.items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-white px-4 py-12 text-center text-sm text-muted">
          Публичных фраз пока нет.
        </p>
      ) : (
        <>
          <p className="mb-4 text-sm text-muted">Найдено: {result.total}</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {result.items.map((phrase) => (
              <PublicPhraseCard
                key={phrase.id}
                phrase={phrase}
                canLike={isLoggedIn}
              />
            ))}
          </div>

          {result.totalPages > 1 ? (
            <div className="mt-8 flex items-center justify-center gap-3">
              {page > 1 ? (
                <Link
                  href={`/catalog?page=${page - 1}`}
                  className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm hover:bg-slate-50"
                >
                  Назад
                </Link>
              ) : null}
              <span className="text-sm text-muted">
                Стр. {result.page} / {result.totalPages}
              </span>
              {page < result.totalPages ? (
                <Link
                  href={`/catalog?page=${page + 1}`}
                  className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm hover:bg-slate-50"
                >
                  Вперёд
                </Link>
              ) : null}
            </div>
          ) : null}
        </>
      )}
    </main>
  );
}
