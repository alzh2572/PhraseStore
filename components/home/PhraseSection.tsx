import { PublicPhraseCard } from "@/components/home/PublicPhraseCard";
import type { PublicPhraseCard as PublicPhraseCardData } from "@/lib/public-phrases";

type Props = {
  title: string;
  description?: string;
  phrases: PublicPhraseCardData[];
  canLike: boolean;
  emptyText?: string;
};

export function PhraseSection({
  title,
  description,
  phrases,
  canLike,
  emptyText = "Пока нет публичных фраз.",
}: Props) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-muted">{description}</p>
        ) : null}
      </div>

      {phrases.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-white px-4 py-10 text-center text-sm text-muted">
          {emptyText}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {phrases.map((phrase) => (
            <PublicPhraseCard
              key={phrase.id}
              phrase={phrase}
              canLike={canLike}
            />
          ))}
        </div>
      )}
    </section>
  );
}
