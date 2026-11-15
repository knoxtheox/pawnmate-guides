import { createHash, timingSafeEqual } from "node:crypto";

/** Checks `Authorization: Bearer <CRON_SECRET>` on scheduled-job routes. */
export function isCronAuthorized(authHeader: string | null, secret = process.env.CRON_SECRET): boolean {
  if (!secret || secret.length < 32 || !authHeader?.startsWith("Bearer ")) return false;
  const a = createHash("sha256").update(authHeader.slice(7)).digest();
  const b = createHash("sha256").update(secret).digest();
  return timingSafeEqual(a, b);
}
