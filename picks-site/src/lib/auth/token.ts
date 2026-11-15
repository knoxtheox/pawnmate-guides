import { createHmac, timingSafeEqual } from "node:crypto";

/** Signed session token: base64url(JSON payload) + "." + base64url(HMAC-SHA256). */
export type SessionPayload = { sub: string; iat: number; exp: number };

export const SESSION_COOKIE = "picks_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

function sign(data: string, secret: string): string {
  return createHmac("sha256", secret).update(data).digest("base64url");
}

export function createToken(sub: string, secret: string, now = Date.now()): string {
  if (!secret || secret.length < 32) throw new Error("AUTH_SECRET must be at least 32 characters.");
  const iat = Math.floor(now / 1000);
  const payload: SessionPayload = { sub, iat, exp: iat + SESSION_TTL_SECONDS };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body, secret)}`;
}

export function verifyToken(
  token: string | undefined,
  secret: string | undefined,
  now = Date.now(),
): SessionPayload | null {
  if (!token || !secret || secret.length < 32) return null;
  const dot = token.indexOf(".");
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const sig = Buffer.from(token.slice(dot + 1));
  const expected = Buffer.from(sign(body, secret));
  if (sig.length !== expected.length || !timingSafeEqual(sig, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as SessionPayload;
    if (typeof payload.exp !== "number" || payload.exp * 1000 <= now) return null;
    return payload;
  } catch {
    return null;
  }
}
