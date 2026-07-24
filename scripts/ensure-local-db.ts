import "dotenv/config";
import { Client } from "pg";

async function main() {
  const localUrl =
    process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
  if (!localUrl) throw new Error("DATABASE_URL не задан");

  const dbName = "phrasestore";
  const adminUrl = localUrl.replace(/\/[^/?]+(\?|$)/, "/postgres$1");

  const client = new Client({ connectionString: adminUrl });
  await client.connect();

  const exists = await client.query(
    `SELECT 1 FROM pg_database WHERE datname = $1`,
    [dbName]
  );

  if (exists.rowCount === 0) {
    await client.query(`CREATE DATABASE "${dbName}"`);
    console.log(`Created database ${dbName}`);
  } else {
    console.log(`Database ${dbName} already exists`);
  }

  await client.end();
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
