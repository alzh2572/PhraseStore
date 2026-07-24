import { NextResponse } from "next/server";

/** view-db — только локальный development. */
export function ensureViewDbEnabled(): NextResponse | null {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "view-db доступен только в development" },
      { status: 403 }
    );
  }
  return null;
}
