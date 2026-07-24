import type { DbProfile } from "./types";

export function parseDbProfile(value: string | null | undefined): DbProfile {
  return value === "remote" ? "remote" : "local";
}

export function getConnectionString(profile: DbProfile): string {
  if (profile === "local") {
    const url =
      process.env.DATABASE_URL_LOCAL ??
      (isLocalUrl(process.env.DATABASE_URL) ? process.env.DATABASE_URL : null);
    if (!url) {
      throw new Error("DATABASE_URL_LOCAL не задан в .env");
    }
    return url;
  }

  const url =
    process.env.DATABASE_URL_REMOTE ??
    (!isLocalUrl(process.env.DATABASE_URL) ? process.env.DATABASE_URL : null);
  if (!url) {
    throw new Error(
      "DATABASE_URL_REMOTE не задан в .env (рабочая БД / Neon)"
    );
  }
  return url;
}

function isLocalUrl(url: string | undefined): boolean {
  if (!url) return false;
  return url.includes("localhost") || url.includes("127.0.0.1");
}
