import "dotenv/config";
import { createHash, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../lib/generated/prisma";

const MIGRATION_NAME = "20260724120000_init";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL missing");

  const adapter = new PrismaNeon({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    const sqlPath = join(
      process.cwd(),
      "prisma",
      "migrations",
      MIGRATION_NAME,
      "migration.sql"
    );
    const sql = readFileSync(sqlPath, "utf8");
    const checksum = createHash("sha256").update(sql).digest("hex");

    await prisma.$executeRawUnsafe(`
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

    await prisma.$executeRawUnsafe(sql);

    await prisma.$executeRawUnsafe(
      `DELETE FROM "_prisma_migrations" WHERE "migration_name" = $1`,
      MIGRATION_NAME
    );

    await prisma.$executeRawUnsafe(
      `INSERT INTO "_prisma_migrations"
        ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count")
       VALUES ($1, $2, now(), $3, NULL, NULL, now(), 1)`,
      randomUUID(),
      checksum,
      MIGRATION_NAME
    );

    console.log(`Migration ${MIGRATION_NAME} applied`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
