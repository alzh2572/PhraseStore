import Link from "next/link";
import { Separator } from "@/components/ui/separator";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-sm text-muted">
          © PhraseStore {year}
        </p>
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <Link href="/policy" className="hover:text-slate-900 hover:underline">
            Политика
          </Link>
          <Separator orientation="vertical" className="hidden h-4 sm:block" />
          <Link href="/contacts" className="hover:text-slate-900 hover:underline">
            Контакты
          </Link>
        </div>
      </div>
    </footer>
  );
}
