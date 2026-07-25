import Link from "next/link";
import { LikeButton } from "@/components/dashboard/LikeButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { PublicPhraseCard as PublicPhraseCardData } from "@/lib/public-phrases";

type Props = {
  phrase: PublicPhraseCardData;
  /** Гость: лайк покажет «войдите»; авторизованный — toggle */
  canLike: boolean;
};

/**
 * Публичная карточка без CRUD-кнопок (главная / каталог).
 */
export function PublicPhraseCard({ phrase, canLike }: Props) {
  const dateLabel = new Date(phrase.createdAt).toLocaleDateString("ru-RU");

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle className="line-clamp-2">{phrase.title}</CardTitle>
        <CardDescription>
          {phrase.authorName} · {dateLabel}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 space-y-3">
        <p className="line-clamp-3 text-sm text-slate-600">{phrase.content}</p>
        {phrase.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {phrase.tags.map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
          </div>
        ) : null}
      </CardContent>
      <CardFooter className="justify-between gap-3">
        <LikeButton
          phraseId={phrase.id}
          initialLiked={phrase.likedByMe}
          initialCount={phrase.likesCount}
          loginHref={canLike ? undefined : "/login"}
        />
        <Button asChild variant="secondary" size="sm">
          <Link href={`/phrase/${phrase.id}`}>Открыть</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
