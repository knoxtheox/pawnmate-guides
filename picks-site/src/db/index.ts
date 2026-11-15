import "server-only";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { pool?: Pool };

function makePool() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return new Pool({ connectionString: url, max: 5 });
}

export function getPool(): Pool {
  globalForDb.pool ??= makePool();
  return globalForDb.pool;
}

export function getDb() {
  return drizzle(getPool(), { schema });
}

export { schema };
