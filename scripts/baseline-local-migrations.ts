import "dotenv/config";
import { createHash, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Client } from "pg";

/** Полный reset public + применение единственной init-миграции (только localhost). */
async function main() {
  const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL не задан");
  if (!url.includes("localhost") && !url.includes("127.0.0.1")) {
    throw new Error("Только для localhost");
  }

  const migration = "20260724160000_init";
  const sql = readFileSync(
    join(process.cwd(), "prisma", "migrations", migration, "migration.sql"),
    "utf8"
  );
  const checksum = createHash("sha256").update(sql).digest("hex");

  const client = new Client({ connectionString: url });
  await client.connect();

  try {
    await client.query("BEGIN");
    await client.query(`
      DROP SCHEMA IF EXISTS public CASCADE;
      CREATE SCHEMA public;
      GRANT ALL ON SCHEMA public TO public;
    `);
    await client.query(sql);
    await client.query(`
      CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
        "id" VARCHAR(36) PRIMARY KEY,
        "checksum" VARCHAR(64) NOT NULL,
        "finished_at" TIMESTAMPTZ,
        "migration_name" VARCHAR(255) NOT NULL,
        "logs" TEXT,
        "rolled_back_at" TIMESTAMPTZ,
        "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "applied_steps_count" INTEGER NOT NULL DEFAULT 0
      );
    `);
    await client.query(
      `INSERT INTO "_prisma_migrations"
        ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count")
       VALUES ($1, $2, now(), $3, NULL, NULL, now(), 1)`,
      [randomUUID(), checksum, migration]
    );
    await client.query("COMMIT");
    console.log(`Local DB rebuilt from ${migration}`);
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
