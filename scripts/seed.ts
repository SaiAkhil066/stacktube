// Seeds DATABASE_URL with demo channels and videos (only if it has no videos).
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/db/schema";
import { seedIfEmpty } from "../src/db/seed";

config({ path: [".env.local", ".env"] });

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Set DATABASE_URL first. Local PGlite seeds itself on startup.");
  const client = postgres(url, { max: 1 });
  await seedIfEmpty(drizzle(client, { schema }));
  await client.end();
  console.log("seed: done");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
