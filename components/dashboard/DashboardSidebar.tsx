"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  History,
  MessageSquare,
  Settings,
  Star,
  UserRound,
} from "lucide-react";
import { cn, formatDisplayName } from "@/lib/utils";

type Props = {
  name: string | null | undefined;
  email: string | null | undefined;
  image: string | null | undefined;
};

const NAV = [
  { href: "/dashboard/profile", label: "Профиль", icon: UserRound },
  { href: "/dashboard", label: "Фразы/Цитаты", icon: MessageSquare },
  { href: "/dashboard/favorites", label: "Избранное", icon: Star },
  { href: "/dashboard/history", label: "История", icon: History },
  { href: "/dashboard/settings", label: "Настройки", icon: Settings },
] as const;

export function DashboardSidebar({ name, email, image }: Props) {
  const pathname = usePathname();
  const display = formatDisplayName(name, email);

  return (
    <aside className="flex w-[280px] shrink-0 flex-col border-r border-sky-100 bg-gradient-to-b from-[#eaf3fc] via-[#e8f1fb] to-[#dde9f6] px-4 py-6">
      <div className="mb-8 flex flex-col items-center gap-3 px-2 text-center">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={display}
            className="h-20 w-20 rounded-full border-4 border-white object-cover shadow-sm"
            width={80}
            height={80}
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-sky-200 text-2xl font-semibold text-sky-800 shadow-sm">
            {display.slice(0, 1).toUpperCase()}
          </div>
        )}
        <p className="text-base font-semibold text-slate-800">{display}</p>
      </div>

      <nav className="flex flex-col gap-1" aria-label="Кабинет">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/dashboard"
              ? pathname === "/dashboard" || pathname === "/dashboard/public"
              : pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-active text-sky-800 shadow-sm"
                  : "text-slate-600 hover:bg-white/60 hover:text-slate-900"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-6">
        <Link
          href="/dashboard/public"
          className={cn(
            "block rounded-xl px-3 py-2 text-sm font-medium",
            pathname === "/dashboard/public"
              ? "bg-white/70 text-sky-800"
              : "text-slate-500 hover:bg-white/50 hover:text-slate-800"
          )}
        >
          Публичные фразы →
        </Link>
      </div>
    </aside>
  );
}
