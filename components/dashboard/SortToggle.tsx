"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import type { PhraseSort } from "@/lib/phrases";

type Props = {
  current: PhraseSort;
};

/** Переключатель сортировки публичных фраз: recent | popular. */
export function SortToggle({ current }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function hrefFor(sort: PhraseSort) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", sort);
    params.delete("page");
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  return (
    <div
      className="inline-flex rounded-lg border border-border bg-white p-0.5 text-sm"
      role="group"
      aria-label="Сортировка"
    >
      {(
        [
          { value: "recent", label: "По дате" },
          { value: "popular", label: "По популярности" },
        ] as const
      ).map(({ value, label }) => (
        <Link
          key={value}
          href={hrefFor(value)}
          className={cn(
            "rounded-md px-3 py-1.5 font-medium transition-colors",
            current === value
              ? "bg-sky-100 text-sky-800"
              : "text-slate-600 hover:bg-slate-50"
          )}
        >
          {label}
        </Link>
      ))}
    </div>
  );
}
