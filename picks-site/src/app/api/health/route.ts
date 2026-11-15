import { checkDb } from "@/lib/status";

// Public health check for Railway. Reveals only up/down.
export async function GET() {
  const db = await checkDb();
  return Response.json({ ok: db.ok }, { status: db.ok ? 200 : 503 });
}
