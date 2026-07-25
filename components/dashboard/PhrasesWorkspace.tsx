"use client";

import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { PhraseCard, type PhraseCardData } from "@/components/dashboard/PhraseCard";
import { PhraseDialog } from "@/components/dashboard/PhraseDialog";
import { SearchInput } from "@/components/dashboard/SearchInput";
import { Button } from "@/components/ui/button";

type Props = {
  title: string;
  subtitle?: string;
  phrases: PhraseCardData[];
  currentUserId: string;
  page: number;
  totalPages: number;
  total: number;
  showCreate?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  basePath: string;
  q?: string;
};

export function PhrasesWorkspace({
  title,
  subtitle,
  phrases,
  currentUserId,
  page,
  totalPages,
  total,
  showCreate = false,
  emptyTitle,
  emptyDescription,
  basePath,
  q,
}: Props) {
  function pageHref(nextPage: number) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (nextPage > 1) params.set("page", String(nextPage));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Личный кабинет
          </h1>
          <h2 className="mt-1 text-lg font-semibold text-slate-700">{title}</h2>
          {subtitle ? (
            <p className="mt-1 text-sm text-muted">{subtitle}</p>
          ) : null}
        </div>

        {showCreate ? (
          <PhraseDialog
            mode="create"
            trigger={
              <Button className="shrink-0 shadow-sm">
                <Plus className="h-4 w-4" />
                Новая фраза/цитата
              </Button>
            }
          />
        ) : null}
      </div>

      <Suspense fallback={<div className="h-10 max-w-md animate-pulse rounded-lg bg-slate-100" />}>
        <SearchInput />
      </Suspense>

      {phrases.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <>
          <p className="text-sm text-muted">
            Найдено: {total}
            {q ? ` по запросу «${q}»` : ""}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {phrases.map((phrase) => (
              <PhraseCard
                key={phrase.id}
                phrase={phrase}
                currentUserId={currentUserId}
              />
            ))}
          </div>

          {totalPages > 1 ? (
            <div className="flex items-center justify-center gap-3 pt-2">
              {page > 1 ? (
                <Link
                  href={pageHref(page - 1)}
                  className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm hover:bg-slate-50"
                >
                  Назад
                </Link>
              ) : (
                <span className="rounded-lg border border-transparent px-3 py-1.5 text-sm text-muted-foreground">
                  Назад
                </span>
              )}
              <span className="text-sm text-muted">
                Стр. {page} / {totalPages}
              </span>
              {page < totalPages ? (
                <Link
                  href={pageHref(page + 1)}
                  className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm hover:bg-slate-50"
                >
                  Вперёд
                </Link>
              ) : (
                <span className="rounded-lg border border-transparent px-3 py-1.5 text-sm text-muted-foreground">
                  Вперёд
                </span>
              )}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
