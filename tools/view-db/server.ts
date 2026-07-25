/**
 * Локальный CRUD-просмотрщик БД (отдельно от PhraseStore).
 * Слушает только 127.0.0.1 — не для деплоя.
 *
 * Запуск из корня репо:
 *   npm run view-db
 */
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";
import { parseDbProfile } from "./lib/connection";
import {
  deleteRow,
  insertRow,
  listProfiles,
  listRows,
  listTables,
  updateRow,
} from "./lib/repository";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "../..");
const publicDir = path.join(__dirname, "public");

loadEnv({ path: path.join(rootDir, ".env") });

const HOST = "127.0.0.1";
const PORT = Number(process.env.VIEW_DB_PORT ?? "3010");

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function sendJson(
  res: ServerResponse,
  status: number,
  body: unknown
): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(payload),
  });
  res.end(payload);
}

async function readBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  if (chunks.length === 0) return {};
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw.trim()) return {};
  return JSON.parse(raw) as unknown;
}

async function serveStatic(
  res: ServerResponse,
  urlPath: string
): Promise<boolean> {
  const safe = urlPath === "/" ? "/index.html" : urlPath;
  const filePath = path.normalize(path.join(publicDir, safe));
  if (!filePath.startsWith(publicDir)) {
    sendJson(res, 403, { error: "Forbidden" });
    return true;
  }

  try {
    const data = await readFile(filePath);
    const ext = path.extname(filePath);
    res.writeHead(200, {
      "Content-Type": MIME[ext] ?? "application/octet-stream",
      "Content-Length": data.length,
    });
    res.end(data);
    return true;
  } catch {
    return false;
  }
}

async function handleApi(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL
): Promise<void> {
  const method = req.method ?? "GET";

  try {
    if (url.pathname === "/api/tables" && method === "GET") {
      const dbParam = url.searchParams.get("db");
      if (!dbParam) {
        sendJson(res, 200, { profiles: listProfiles() });
        return;
      }
      const profile = parseDbProfile(dbParam);
      const tables = await listTables(profile);
      sendJson(res, 200, { db: profile, tables });
      return;
    }

    if (url.pathname === "/api/rows" && method === "GET") {
      const profile = parseDbProfile(url.searchParams.get("db"));
      const table = url.searchParams.get("table");
      if (!table) {
        sendJson(res, 400, { error: "table обязателен" });
        return;
      }
      const page = Number(url.searchParams.get("page") ?? "1");
      const pageSize = Number(url.searchParams.get("pageSize") ?? "20");
      const data = await listRows(profile, table, page, pageSize);
      sendJson(res, 200, data);
      return;
    }

    if (url.pathname === "/api/rows" && method === "POST") {
      const body = (await readBody(req)) as {
        db?: string;
        table?: string;
        data?: Record<string, unknown>;
      };
      const profile = parseDbProfile(body.db);
      const table = String(body.table ?? "");
      const row = await insertRow(profile, table, body.data ?? {});
      sendJson(res, 200, { row });
      return;
    }

    if (url.pathname === "/api/rows" && method === "PUT") {
      const body = (await readBody(req)) as {
        db?: string;
        table?: string;
        keys?: Record<string, unknown>;
        data?: Record<string, unknown>;
      };
      const profile = parseDbProfile(body.db);
      const table = String(body.table ?? "");
      const row = await updateRow(
        profile,
        table,
        body.keys ?? {},
        body.data ?? {}
      );
      sendJson(res, 200, { row });
      return;
    }

    if (url.pathname === "/api/rows" && method === "DELETE") {
      const body = (await readBody(req)) as {
        db?: string;
        table?: string;
        keys?: Record<string, unknown>;
      };
      const profile = parseDbProfile(body.db);
      const table = String(body.table ?? "");
      await deleteRow(profile, table, body.keys ?? {});
      sendJson(res, 200, { ok: true });
      return;
    }

    sendJson(res, 404, { error: "Not found" });
  } catch (error) {
    sendJson(res, 500, {
      error: error instanceof Error ? error.message : "Ошибка",
    });
  }
}

const server = createServer(async (req, res) => {
  const host = req.headers.host ?? `${HOST}:${PORT}`;
  const url = new URL(req.url ?? "/", `http://${host}`);

  if (url.pathname.startsWith("/api/")) {
    await handleApi(req, res, url);
    return;
  }

  const served = await serveStatic(res, url.pathname);
  if (served) return;

  // SPA fallback
  await serveStatic(res, "/index.html");
});

server.listen(PORT, HOST, () => {
  console.log(`view-db: http://${HOST}:${PORT}`);
  console.log("Локальный инструмент — не часть PhraseStore / Vercel.");
});
