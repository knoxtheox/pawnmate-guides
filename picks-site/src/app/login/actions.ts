"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { verifyPassword } from "@/lib/auth/password";
import { createToken, SESSION_COOKIE, SESSION_TTL_SECONDS } from "@/lib/auth/token";

// Simple in-memory throttle: 5 failed attempts per IP per 15 minutes.
const failures = new Map<string, { count: number; first: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;

function safeNext(next: FormDataEntryValue | null): string {
  const value = typeof next === "string" ? next : "";
  return value.startsWith("/") && !value.startsWith("//") ? value : "/picks";
}

export type LoginState = { error?: string; email?: string };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  const record = failures.get(ip);
  if (record && now - record.first < WINDOW_MS && record.count >= MAX_FAILURES) {
    return { error: "Too many attempts. Try again in 15 minutes.", email: String(formData.get("email") ?? "") };
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const ownerEmail = process.env.AUTH_EMAIL?.trim().toLowerCase();
  const ownerHash = process.env.AUTH_PASSWORD_HASH;
  const secret = process.env.AUTH_SECRET;

  if (!ownerEmail || !ownerHash || !secret) {
    return { error: "Sign-in is not configured on the server (AUTH_EMAIL, AUTH_PASSWORD_HASH, AUTH_SECRET)." };
  }

  // Always run the hash check so timing doesn't reveal whether the email matched.
  const passwordOk = await verifyPassword(password, ownerHash);
  if (!passwordOk || email !== ownerEmail) {
    const fresh = !record || now - record.first >= WINDOW_MS;
    failures.set(ip, { count: fresh ? 1 : record.count + 1, first: fresh ? now : record.first });
    return { error: "Wrong email or password.", email };
  }

  failures.delete(ip);
  (await cookies()).set(SESSION_COOKIE, createToken(ownerEmail, secret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  redirect(safeNext(formData.get("next")));
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}
