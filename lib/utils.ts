import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Короткое отображаемое имя: «Антон Л.» */
export function formatDisplayName(
  name: string | null | undefined,
  email?: string | null
): string {
  const raw = (name ?? "").trim();
  if (raw) {
    const parts = raw.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0];
    const last = parts[parts.length - 1];
    return `${parts[0]} ${last[0]?.toUpperCase() ?? ""}.`;
  }
  if (email) return email.split("@")[0] ?? "Пользователь";
  return "Пользователь";
}
