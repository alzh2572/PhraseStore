import { Client } from "pg";
import { getConnectionString } from "./connection";
import type {
  ColumnMeta,
  DbProfile,
  DbProfileInfo,
  TableRowsResponse,
} from "./types";

const IDENT = /^[A-Za-z_][A-Za-z0-9_]*$/;

function quoteIdent(name: string): string {
  if (!IDENT.test(name)) {
    throw new Error(`Недопустимое имя: ${name}`);
  }
  return `"${name}"`;
}

async function withClient<T>(
  profile: DbProfile,
  fn: (client: Client) => Promise<T>
): Promise<T> {
  const connectionString = getConnectionString(profile);
  const client = new Client({
    connectionString,
    ssl: connectionString.includes("localhost")
      ? false
      : { rejectUnauthorized: false },
  });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

export function listProfiles(): DbProfileInfo[] {
  const localUrl =
    process.env.DATABASE_URL_LOCAL ??
    (process.env.DATABASE_URL?.includes("localhost")
      ? process.env.DATABASE_URL
      : undefined);
  const remoteUrl =
    process.env.DATABASE_URL_REMOTE ??
    (process.env.DATABASE_URL &&
    !process.env.DATABASE_URL.includes("localhost") &&
    !process.env.DATABASE_URL.includes("127.0.0.1")
      ? process.env.DATABASE_URL
      : undefined);

  return [
    {
      id: "local",
      label: "Локальная БД",
      available: Boolean(localUrl),
      hint: localUrl ? undefined : "Задайте DATABASE_URL_LOCAL",
    },
    {
      id: "remote",
      label: "Рабочая БД (Neon)",
      available: Boolean(remoteUrl),
      hint: remoteUrl ? undefined : "Задайте DATABASE_URL_REMOTE",
    },
  ];
}

export async function listTables(profile: DbProfile): Promise<string[]> {
  return withClient(profile, async (client) => {
    const result = await client.query<{ name: string }>(
      `SELECT table_name AS name
       FROM information_schema.tables
       WHERE table_schema = 'public'
         AND table_type = 'BASE TABLE'
         AND table_name <> '_prisma_migrations'
       ORDER BY table_name`
    );
    return result.rows.map((r) => r.name);
  });
}

export async function getColumns(
  profile: DbProfile,
  table: string
): Promise<ColumnMeta[]> {
  quoteIdent(table);
  return withClient(profile, async (client) => {
    const result = await client.query<{
      name: string;
      data_type: string;
      is_nullable: string;
      column_default: string | null;
      is_pk: boolean;
    }>(
      `SELECT
         c.column_name AS name,
         c.data_type,
         c.is_nullable,
         c.column_default,
         EXISTS (
           SELECT 1
           FROM information_schema.table_constraints tc
           JOIN information_schema.key_column_usage kcu
             ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
           WHERE tc.table_schema = 'public'
             AND tc.table_name = $1
             AND tc.constraint_type = 'PRIMARY KEY'
             AND kcu.column_name = c.column_name
         ) AS is_pk
       FROM information_schema.columns c
       WHERE c.table_schema = 'public' AND c.table_name = $1
       ORDER BY c.ordinal_position`,
      [table]
    );

    return result.rows.map((r) => ({
      name: r.name,
      dataType: r.data_type,
      isNullable: r.is_nullable === "YES",
      isPrimaryKey: r.is_pk,
      hasDefault: r.column_default != null,
    }));
  });
}

export async function listRows(
  profile: DbProfile,
  table: string,
  page: number,
  pageSize: number
): Promise<TableRowsResponse> {
  const safeTable = quoteIdent(table);
  const safePage = Math.max(1, page);
  const safeSize = Math.min(100, Math.max(1, pageSize));
  const offset = (safePage - 1) * safeSize;
  const columns = await getColumns(profile, table);

  return withClient(profile, async (client) => {
    const countResult = await client.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM ${safeTable}`
    );
    const total = Number(countResult.rows[0]?.count ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / safeSize));

    const pkCols = columns.filter((c) => c.isPrimaryKey).map((c) => c.name);
    const orderBy =
      pkCols.length > 0
        ? pkCols.map((c) => quoteIdent(c)).join(", ")
        : columns[0]
          ? quoteIdent(columns[0].name)
          : "1";

    const rowsResult = await client.query(
      `SELECT * FROM ${safeTable}
       ORDER BY ${orderBy}
       LIMIT $1 OFFSET $2`,
      [safeSize, offset]
    );

    const rows = rowsResult.rows.map((row) => serializeRow(row));

    return {
      table,
      columns,
      rows,
      page: safePage,
      pageSize: safeSize,
      total,
      totalPages,
    };
  });
}

function serializeRow(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    if (value instanceof Date) {
      out[key] = value.toISOString();
    } else if (typeof value === "bigint") {
      out[key] = value.toString();
    } else {
      out[key] = value;
    }
  }
  return out;
}

function coerceValue(raw: unknown, column: ColumnMeta): unknown {
  if (raw === "" || raw === undefined) {
    if (column.isNullable || column.hasDefault) return null;
    return raw;
  }
  if (raw === null) return null;

  const type = column.dataType.toLowerCase();
  if (type.includes("int") || type === "numeric" || type === "decimal") {
    const n = Number(raw);
    if (Number.isNaN(n)) throw new Error(`Поле ${column.name}: ожидается число`);
    return n;
  }
  if (type === "boolean") {
    if (typeof raw === "boolean") return raw;
    if (raw === "true" || raw === "1") return true;
    if (raw === "false" || raw === "0") return false;
  }
  if (type.includes("timestamp") || type === "date") {
    return new Date(String(raw));
  }
  return raw;
}

export async function insertRow(
  profile: DbProfile,
  table: string,
  data: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const columns = await getColumns(profile, table);
  const writable = columns.filter((c) => {
    const value = data[c.name];
    if (value === undefined || value === "") {
      return false;
    }
    return true;
  });

  if (writable.length === 0) {
    throw new Error("Нет данных для вставки");
  }

  const colSql = writable.map((c) => quoteIdent(c.name)).join(", ");
  const params = writable.map((c) => coerceValue(data[c.name], c));
  const placeholders = params.map((_, i) => `$${i + 1}`).join(", ");

  return withClient(profile, async (client) => {
    const result = await client.query(
      `INSERT INTO ${quoteIdent(table)} (${colSql})
       VALUES (${placeholders})
       RETURNING *`,
      params
    );
    return serializeRow(result.rows[0]);
  });
}

export async function updateRow(
  profile: DbProfile,
  table: string,
  keys: Record<string, unknown>,
  data: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const columns = await getColumns(profile, table);
  const pkCols = columns.filter((c) => c.isPrimaryKey);
  if (pkCols.length === 0) {
    throw new Error("У таблицы нет PRIMARY KEY — update невозможен");
  }

  const setCols = columns.filter(
    (c) => !c.isPrimaryKey && data[c.name] !== undefined
  );
  if (setCols.length === 0) {
    throw new Error("Нет полей для обновления");
  }

  const params: unknown[] = [];
  const setSql = setCols.map((c) => {
    params.push(coerceValue(data[c.name], c));
    return `${quoteIdent(c.name)} = $${params.length}`;
  });

  const whereSql = pkCols.map((c) => {
    const key = keys[c.name];
    if (key === undefined || key === null || key === "") {
      throw new Error(`Не указан ключ ${c.name}`);
    }
    params.push(coerceValue(key, c));
    return `${quoteIdent(c.name)} = $${params.length}`;
  });

  return withClient(profile, async (client) => {
    const result = await client.query(
      `UPDATE ${quoteIdent(table)}
       SET ${setSql.join(", ")}
       WHERE ${whereSql.join(" AND ")}
       RETURNING *`,
      params
    );
    if (result.rowCount === 0) {
      throw new Error("Строка не найдена");
    }
    return serializeRow(result.rows[0]);
  });
}

export async function deleteRow(
  profile: DbProfile,
  table: string,
  keys: Record<string, unknown>
): Promise<void> {
  const columns = await getColumns(profile, table);
  const pkCols = columns.filter((c) => c.isPrimaryKey);
  if (pkCols.length === 0) {
    throw new Error("У таблицы нет PRIMARY KEY — delete невозможен");
  }

  const params: unknown[] = [];
  const whereSql = pkCols.map((c) => {
    const key = keys[c.name];
    if (key === undefined || key === null || key === "") {
      throw new Error(`Не указан ключ ${c.name}`);
    }
    params.push(coerceValue(key, c));
    return `${quoteIdent(c.name)} = $${params.length}`;
  });

  await withClient(profile, async (client) => {
    const result = await client.query(
      `DELETE FROM ${quoteIdent(table)}
       WHERE ${whereSql.join(" AND ")}`,
      params
    );
    if (result.rowCount === 0) {
      throw new Error("Строка не найдена");
    }
  });
}
