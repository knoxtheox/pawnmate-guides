import "server-only";
import { getPool } from "@/db";

export type DbStatus = { ok: true; migrations: number; latencyMs: number } | { ok: false; error: string };

export async function checkDb(): Promise<DbStatus> {
  const start = Date.now();
  try {
    const pool = getPool();
    const res = await pool.query<{ n: string }>(
      "select count(*)::text as n from drizzle.__drizzle_migrations",
    );
    return { ok: true, migrations: Number(res.rows[0]?.n ?? 0), latencyMs: Date.now() - start };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/** Which server settings are present. Never returns the values. */
export function configStatus() {
  const has = (k: string) => Boolean(process.env[k]?.trim());
  return [
    { key: "DATABASE_URL", label: "Database", set: has("DATABASE_URL") },
    { key: "AUTH_EMAIL", label: "Sign-in email", set: has("AUTH_EMAIL") },
    { key: "AUTH_PASSWORD_HASH", label: "Sign-in password hash", set: has("AUTH_PASSWORD_HASH") },
    { key: "AUTH_SECRET", label: "Session signing secret", set: (process.env.AUTH_SECRET?.length ?? 0) >= 32 },
    { key: "CRON_SECRET", label: "Scheduled-job secret", set: (process.env.CRON_SECRET?.length ?? 0) >= 32 },
    { key: "ODDS_API_KEY", label: "The Odds API key", set: has("ODDS_API_KEY") },
    { key: "CFBD_API_KEY", label: "CollegeFootballData key", set: has("CFBD_API_KEY") },
  ];
}
