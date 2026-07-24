import { NextRequest, NextResponse } from "next/server";
import { parseDbProfile } from "@/lib/view-db/connection";
import { ensureViewDbEnabled } from "@/lib/view-db/guard";
import {
  deleteRow,
  insertRow,
  listRows,
  updateRow,
} from "@/lib/view-db/repository";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const blocked = ensureViewDbEnabled();
  if (blocked) return blocked;

  try {
    const sp = request.nextUrl.searchParams;
    const profile = parseDbProfile(sp.get("db"));
    const table = sp.get("table");
    if (!table) {
      return NextResponse.json({ error: "table обязателен" }, { status: 400 });
    }
    const page = Number(sp.get("page") ?? "1");
    const pageSize = Number(sp.get("pageSize") ?? "20");
    const data = await listRows(profile, table, page, pageSize);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ошибка" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const blocked = ensureViewDbEnabled();
  if (blocked) return blocked;

  try {
    const body = await request.json();
    const profile = parseDbProfile(body.db);
    const table = String(body.table ?? "");
    const data = (body.data ?? {}) as Record<string, unknown>;
    const row = await insertRow(profile, table, data);
    return NextResponse.json({ row });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ошибка" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const blocked = ensureViewDbEnabled();
  if (blocked) return blocked;

  try {
    const body = await request.json();
    const profile = parseDbProfile(body.db);
    const table = String(body.table ?? "");
    const keys = (body.keys ?? {}) as Record<string, unknown>;
    const data = (body.data ?? {}) as Record<string, unknown>;
    const row = await updateRow(profile, table, keys, data);
    return NextResponse.json({ row });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ошибка" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const blocked = ensureViewDbEnabled();
  if (blocked) return blocked;

  try {
    const body = await request.json();
    const profile = parseDbProfile(body.db);
    const table = String(body.table ?? "");
    const keys = (body.keys ?? {}) as Record<string, unknown>;
    await deleteRow(profile, table, keys);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ошибка" },
      { status: 500 }
    );
  }
}
