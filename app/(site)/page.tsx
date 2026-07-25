import Link from "next/link";
import { Plus } from "lucide-react";
import { auth } from "@/auth";
import { PhraseSection } from "@/components/home/PhraseSection";
import { Button } from "@/components/ui/button";
import { getHomePublicPhrases } from "@/lib/public-phrases";

export const dynamic = "force-dynamic";

type HomePageProps = {
  searchParams: Promise<{ error?: string }>;
};

/**
 * Главная: hero + «Новые» + «Популярные» (только PUBLIC).
 * CRUD на главной нет — только просмотр и лайк.
 */
export default async function HomePage({ searchParams }: HomePageProps) {
  const session = await auth();
  const isLoggedIn = Boolean(session?.user?.id);
  const { recent, popular } = await getHomePublicPhrases(session?.user?.id);

  const { error } = await searchParams;
  const errorText =
    error === "Configuration"
      ? "Ошибка конфигурации Auth.js. Проверьте переменные Google/AUTH на Vercel."
      : error === "AccessDenied"
        ? "Доступ запрещён Google."
        : error
          ? `Ошибка входа (${error}).`
          : null;

  return (
    <main>
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-sky-50 via-white to-slate-50">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_45%)]" />
        <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">
            PhraseStore
          </p>
          <h1 className="mt-2 max-w-2xl text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Фразы и цитаты, которыми хочется делиться
          </h1>
          <p className="mt-4 max-w-xl text-base text-slate-600 sm:text-lg">
            Смотрите новые и популярные публичные записи. Добавляйте свои — после
            входа в личный кабинет.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            {isLoggedIn ? (
              <Button asChild size="lg">
                <Link href="/dashboard">
                  <Plus className="h-4 w-4" />
                  Добавить фразу/цитату
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild size="lg">
                  <Link href="/login">
                    <Plus className="h-4 w-4" />
                    Добавить фразу/цитату
                  </Link>
                </Button>
                <p className="text-sm text-muted">
                  Войдите, чтобы добавлять
                </p>
              </>
            )}
          </div>

          {errorText ? (
            <p
              className="mt-6 max-w-xl rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              role="alert"
            >
              {errorText}
            </p>
          ) : null}
        </div>
      </section>

      <div className="mx-auto flex max-w-6xl flex-col gap-14 px-4 py-12 sm:px-6 sm:py-16">
        <PhraseSection
          title="Новые"
          description="Последние публичные фразы и цитаты"
          phrases={recent}
          canLike={isLoggedIn}
        />
        <PhraseSection
          title="Популярные"
          description="Топ по количеству лайков"
          phrases={popular}
          canLike={isLoggedIn}
        />
      </div>
    </main>
  );
}
