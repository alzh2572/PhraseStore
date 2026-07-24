import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "@/lib/generated/prisma";

export function isLocalDatabaseUrl(connectionString: string): boolean {
  return (
    connectionString.includes("localhost") ||
    connectionString.includes("127.0.0.1")
  );
}

export function createPrismaClient(connectionString = process.env.DATABASE_URL) {
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  if (isLocalDatabaseUrl(connectionString)) {
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
  }

  const adapter = new PrismaNeon({ connectionString });
  return new PrismaClient({ adapter });
}
