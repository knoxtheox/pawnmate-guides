import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifyToken, type SessionPayload } from "./token";

/** Data-access-layer check. Pages, server actions and API routes call this in addition to proxy.ts. */
export async function getSession(): Promise<SessionPayload | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = verifyToken(token, process.env.AUTH_SECRET);
  if (!session || session.sub !== process.env.AUTH_EMAIL?.trim().toLowerCase()) return null;
  return session;
}

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}
