"use client";

import Link from "next/link";
import { useState } from "react";
import { ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  phraseId: string;
  initialLiked: boolean;
  initialCount: number;
  /** Если задан — при 401 показываем ссылку на вход */
  loginHref?: string;
};

/**
 * Toggle лайка публичной фразы через POST /api/phrase/[id]/like.
 */
export function LikeButton({
  phraseId,
  initialLiked,
  initialCount,
  loginHref,
}: Props) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (loading) return;

    const prevLiked = liked;
    const prevCount = count;
    setLiked(!prevLiked);
    setCount(Math.max(0, prevCount + (prevLiked ? -1 : 1)));
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/phrase/${phraseId}/like`, {
        method: "POST",
      });
      const json = (await response.json()) as {
        liked?: boolean;
        likesCount?: number;
        error?: string;
      };

      if (response.status === 401) {
        setLiked(prevLiked);
        setCount(prevCount);
        setError(json.error ?? "Войдите, чтобы поставить лайк");
        return;
      }

      if (!response.ok) {
        setLiked(prevLiked);
        setCount(prevCount);
        setError(json.error ?? "Попробуйте позже");
        return;
      }

      setLiked(Boolean(json.liked));
      setCount(Number(json.likesCount ?? 0));
    } catch {
      setLiked(prevLiked);
      setCount(prevCount);
      setError("Попробуйте позже");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={() => void handleClick()}
        disabled={loading}
        aria-pressed={liked}
        aria-label={liked ? "Убрать лайк" : "Поставить лайк"}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm font-medium transition-colors",
          liked
            ? "border-sky-200 bg-sky-50 text-sky-700"
            : "border-border bg-white text-slate-600 hover:bg-slate-50",
          loading && "cursor-not-allowed opacity-60"
        )}
      >
        <ThumbsUp
          className={cn("h-4 w-4", liked && "fill-sky-600 text-sky-700")}
        />
        <span>{count}</span>
      </button>
      {error ? (
        <span className="text-xs text-danger" role="alert">
          {error}
          {loginHref ? (
            <>
              {" "}
              <Link href={loginHref} className="underline">
                Войти
              </Link>
            </>
          ) : null}
        </span>
      ) : null}
    </div>
  );
}
