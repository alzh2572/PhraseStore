import { prisma } from "@/lib/prisma";

/** Таблицы Prisma-моделей (без служебных). */
export const APP_TABLES = [
  "User",
  "Note",
  "Category",
  "Phrase",
  "Tag",
  "PhraseTag",
  "Vote",
] as const;

export type AppTable = (typeof APP_TABLES)[number];

export function isAppTable(value: string): value is AppTable {
  return (APP_TABLES as readonly string[]).includes(value);
}

type Row = Record<string, unknown>;

export async function fetchTableRows(
  table: AppTable,
  take = 50
): Promise<{ columns: string[]; rows: Row[] }> {
  let rows: Row[] = [];

  switch (table) {
    case "User":
      rows = await prisma.user.findMany({ orderBy: { createdAt: "desc" }, take });
      break;
    case "Note":
      rows = await prisma.note.findMany({ orderBy: { createdAt: "desc" }, take });
      break;
    case "Category":
      rows = await prisma.category.findMany({ take });
      break;
    case "Phrase":
      rows = await prisma.phrase.findMany({ orderBy: { updatedAt: "desc" }, take });
      break;
    case "Tag":
      rows = await prisma.tag.findMany({ orderBy: { name: "asc" }, take });
      break;
    case "PhraseTag":
      rows = await prisma.phraseTag.findMany({ take });
      break;
    case "Vote":
      rows = await prisma.vote.findMany({ orderBy: { createdAt: "desc" }, take });
      break;
  }

  const serialized = rows.map((row) => serializeRow(row));
  const columns =
    serialized.length > 0
      ? Object.keys(serialized[0])
      : await inferEmptyColumns(table);

  return { columns, rows: serialized };
}

function serializeRow(row: Row): Row {
  const out: Row = {};
  for (const [key, value] of Object.entries(row)) {
    if (value instanceof Date) {
      out[key] = value.toISOString();
    } else if (value === null || value === undefined) {
      out[key] = value;
    } else if (typeof value === "object") {
      out[key] = JSON.stringify(value);
    } else {
      out[key] = value;
    }
  }
  return out;
}

async function inferEmptyColumns(table: AppTable): Promise<string[]> {
  // Когда строк нет — покажем типичные поля модели
  const defaults: Record<AppTable, string[]> = {
    User: ["id", "email", "name", "createdAt"],
    Note: ["id", "title", "createdAt", "ownerId"],
    Category: ["id", "category"],
    Phrase: [
      "id",
      "title",
      "content",
      "description",
      "visibility",
      "createdAt",
      "updatedAt",
      "publishedAt",
      "ownerId",
      "categoryId",
    ],
    Tag: ["id", "name"],
    PhraseTag: ["phraseId", "tagId"],
    Vote: ["id", "value", "createdAt", "userId", "phraseId"],
  };
  return defaults[table];
}
