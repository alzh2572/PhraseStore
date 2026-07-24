import { NextRequest, NextResponse } from "next/server";
import { parseDbProfile } from "@/lib/view-db/connection";
import { ensureViewDbEnabled } from "@/lib/view-db/guard";
import { listProfiles, listTables } from "@/lib/view-db/repository";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const blocked = ensureViewDbEnabled();
  if (blocked) return blocked;

  try {
    const dbParam = request.nextUrl.searchParams.get("db");
    if (!dbParam) {
      return NextResponse.json({ profiles: listProfiles() });
    }

    const profile = parseDbProfile(dbParam);
    const tables = await listTables(profile);
    return NextResponse.json({ db: profile, tables });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ошибка" },
      { status: 500 }
    );
  }
}
