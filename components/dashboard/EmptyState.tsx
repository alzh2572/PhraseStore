import { MessageSquarePlus } from "lucide-react";

type Props = {
  title?: string;
  description?: string;
};

export function EmptyState({
  title = "У вас пока нет фраз/цитат — создайте первую",
  description = "Нажмите «+ Новая фраза/цитата», чтобы добавить запись.",
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-white px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-sky-50 text-sky-600">
        <MessageSquarePlus className="h-7 w-7" />
      </div>
      <p className="max-w-md text-base font-medium text-slate-800">{title}</p>
      <p className="mt-2 max-w-sm text-sm text-muted">{description}</p>
    </div>
  );
}
