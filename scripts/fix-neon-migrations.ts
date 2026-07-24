import "dotenv/config";
import { createHash, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Client } from "pg";

function checksum(name: string) {
  const sql = readFileSync(
    join(process.cwd(), "prisma/migrations", name, "migration.sql"),
    "utf8"
  );
  return createHash("sha256").update(sql).digest("hex");
}

async function main() {
  // Pooler TCP — стабильнее для коротких DDL/DML с этой машины
  const url = process.env.DATABASE_URL_REMOTE!;
  const client = new Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 30000,
  });
  await client.connect();
  console.log("connected");

  try {
    await client.query(`DELETE FROM "_prisma_migrations"`);
    console.log("cleared migrations table");

    for (const name of [
      "20260724160000_init",
      "20260724170000_auth_google",
    ]) {
      await client.query(
        `INSERT INTO "_prisma_migrations"
          ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count")
         VALUES ($1, $2, now(), $3, NULL, NULL, now(), 1)`,
        [randomUUID(), checksum(name), name]
      );
      console.log("recorded", name);
    }

    const { rows } = await client.query(
      `SELECT migration_name, finished_at IS NOT NULL AS ok FROM "_prisma_migrations" ORDER BY started_at`
    );
    console.log(rows);
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
