import "server-only";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { drizzle as drizzlePostgres, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export type DB = PostgresJsDatabase<typeof schema>;

const MIGRATIONS = path.join(process.cwd(), "drizzle");

// With DATABASE_URL we talk to real Postgres (Neon etc.). Without it, local dev
// uses PGlite — Postgres compiled to WASM, stored in .data/ — migrated and seeded
// automatically so `pnpm dev` works on a fresh clone.
async function connect(): Promise<DB> {
  const url = process.env.DATABASE_URL;
  if (url) {
    return drizzlePostgres(postgres(url, { prepare: false, max: 5 }), { schema });
  }

  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  const dataDir = path.join(process.cwd(), ".data", "pglite");
  mkdirSync(path.dirname(dataDir), { recursive: true });
  const client = new PGlite(dataDir);
  const db = drizzle(client, { schema });
  try {
    await migrate(db, { migrationsFolder: MIGRATIONS });
  } catch (err) {
    // Usually a dev server that was killed mid-write, or a second process using the same folder.
    throw new Error(
      "The local database in .data/ can't be opened. Stop every running `pnpm dev`, delete the .data folder, and start again. " +
        "It will be recreated with the demo videos.",
      { cause: err },
    );
  }
  // Same query API as postgres-js; the cast keeps one DB type across the app.
  const typed = db as unknown as DB;
  const { seed } = await import("./seed");
  await seed(typed);
  return typed;
}

const globalForDb = globalThis as unknown as { __stacktubeDb?: Promise<DB> };

export function getDb(): Promise<DB> {
  globalForDb.__stacktubeDb ??= connect().catch((err) => {
    globalForDb.__stacktubeDb = undefined;
    throw err;
  });
  return globalForDb.__stacktubeDb;
}

export { schema };
