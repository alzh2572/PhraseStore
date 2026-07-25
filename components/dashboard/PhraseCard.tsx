"use client";

import { useOptimistic, useState, useTransition } from "react";
import {
  Globe,
  Lock,
  MessageSquare,
  Pencil,
  Star,
  Trash2,
} from "lucide-react";
import {
  deletePhrase,
  toggleFavorite,
  togglePublic,
} from "@/app/actions/phrases";
import { PhraseDialog } from "@/components/dashboard/PhraseDialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type PhraseCardData = {
  id: string;
  title: string;
  content: string;
  isPublic: boolean;
  isFavorite: boolean;
  createdAt: string | Date;
  ownerId: string;
  voteCount: number;
};

type Props = {
  phrase: PhraseCardData;
  currentUserId: string;
};

export function PhraseCard({ phrase, currentUserId }: Props) {
  const isOwner = phrase.ownerId === currentUserId;
  const [editOpen, setEditOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const [optimistic, setOptimistic] = useOptimistic(
    {
      isFavorite: phrase.isFavorite,
      isPublic: phrase.isPublic,
    },
    (
      state,
      update: Partial<{ isFavorite: boolean; isPublic: boolean }>
    ) => ({ ...state, ...update })
  );

  function onToggleFavorite() {
    if (!isOwner) return;
    startTransition(async () => {
      setOptimistic({ isFavorite: !optimistic.isFavorite });
      const result = await toggleFavorite(phrase.id);
      if (!result.ok) alert(result.error);
    });
  }

  function onTogglePublic() {
    if (!isOwner) return;
    startTransition(async () => {
      setOptimistic({ isPublic: !optimistic.isPublic });
      const result = await togglePublic(phrase.id);
      if (!result.ok) alert(result.error);
    });
  }

  function onDelete() {
    if (!isOwner) return;
    if (!confirm("Удалить фразу/цитату?")) return;
    startTransition(async () => {
      const result = await deletePhrase(phrase.id);
      if (!result.ok) alert(result.error);
    });
  }

  const dateLabel = new Date(phrase.createdAt).toLocaleDateString("ru-RU");

  return (
    <article
      className={cn(
        "flex flex-col rounded-[var(--radius-card)] border border-border bg-card p-4 shadow-sm transition-opacity",
        pending && "opacity-70"
      )}
    >
      <div className="mb-2 flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
          <MessageSquare className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <h3 className="flex-1 text-base font-semibold leading-snug text-slate-900">
              {phrase.title}
            </h3>
            {isOwner ? (
              <button
                type="button"
                onClick={onToggleFavorite}
                className="shrink-0 rounded-md p-1 text-slate-400 hover:bg-amber-50 hover:text-amber-500"
                aria-label={
                  optimistic.isFavorite
                    ? "Убрать из избранного"
                    : "В избранное"
                }
              >
                <Star
                  className={cn(
                    "h-5 w-5",
                    optimistic.isFavorite &&
                      "fill-amber-400 text-amber-400"
                  )}
                />
              </button>
            ) : null}
          </div>
          <p className="mt-1 line-clamp-2 text-sm text-muted">{phrase.content}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Голосов: {phrase.voteCount} · {dateLabel}
          </p>
        </div>
      </div>

      {isOwner ? (
        <div className="mt-auto grid grid-cols-3 gap-2 pt-3">
          <Button
            type="button"
            variant="edit"
            size="sm"
            className="w-full"
            onClick={() => setEditOpen(true)}
          >
            <Pencil className="h-3.5 w-3.5" />
            Правка
          </Button>
          <Button
            type="button"
            variant={optimistic.isPublic ? "success" : "secondary"}
            size="sm"
            className="w-full"
            onClick={onTogglePublic}
          >
            {optimistic.isPublic ? (
              <Globe className="h-3.5 w-3.5" />
            ) : (
              <Lock className="h-3.5 w-3.5" />
            )}
            {optimistic.isPublic ? "Публичный" : "Приватный"}
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            className="w-full"
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Удалить
          </Button>
        </div>
      ) : (
        <div className="mt-auto pt-3 text-xs text-muted">
          Публичная фраза другого автора
        </div>
      )}

      {isOwner ? (
        <PhraseDialog
          mode="edit"
          phrase={{
            id: phrase.id,
            title: phrase.title,
            content: phrase.content,
            isPublic: phrase.isPublic,
          }}
          open={editOpen}
          onOpenChange={setEditOpen}
        />
      ) : null}
    </article>
  );
}
