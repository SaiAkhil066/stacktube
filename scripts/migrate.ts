// Applies drizzle/ migrations to DATABASE_URL. Runs before `next build`, so
// deploys migrate automatically. Local PGlite migrates itself, so this skips.
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

config({ path: [".env.local", ".env"] });

async function main() {
  // Prefer a direct (non-pooled) connection for schema changes when the host provides one.
  const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!url) {
    console.log("migrate: no DATABASE_URL, skipping (local PGlite migrates on startup)");
    return;
  }
  const client = postgres(url, { max: 1 });
  await migrate(drizzle(client), { migrationsFolder: "drizzle" });
  await client.end();
  console.log("migrate: done");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
