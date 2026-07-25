import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { LikeButton } from "@/components/dashboard/LikeButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPublicPhraseById } from "@/lib/public-phrases";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function PhrasePage({ params }: Props) {
  const session = await auth();
  const { id } = await params;
  const phrase = await getPublicPhraseById(id, session?.user?.id);

  if (!phrase) notFound();

  const isLoggedIn = Boolean(session?.user?.id);
  const isOwner = session?.user?.id === phrase.ownerId;
  const dateLabel = new Date(phrase.createdAt).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="mb-4 text-sm text-muted">
        <Link href="/" className="hover:underline">
          Главная
        </Link>
        {" · "}
        <Link href="/catalog" className="hover:underline">
          Каталог
        </Link>
      </p>

      <article className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            {phrase.title}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {phrase.authorName} · {dateLabel}
            {!phrase.isPublic ? " · приватная" : null}
          </p>
          {phrase.tags.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {phrase.tags.map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
          ) : null}
        </header>

        <div className="whitespace-pre-wrap text-base leading-relaxed text-slate-800">
          {phrase.content}
        </div>

        <footer className="mt-8 flex flex-wrap items-center gap-3 border-t border-border pt-5">
          {phrase.isPublic ? (
            <LikeButton
              phraseId={phrase.id}
              initialLiked={phrase.likedByMe}
              initialCount={phrase.likesCount}
              loginHref={isLoggedIn ? undefined : "/login"}
            />
          ) : null}

          {isOwner ? (
            <Button asChild variant="secondary" size="sm">
              <Link href="/dashboard">В кабинет</Link>
            </Button>
          ) : null}
        </footer>
      </article>
    </main>
  );
}
