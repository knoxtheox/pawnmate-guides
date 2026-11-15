import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createToken, verifyToken, SESSION_TTL_SECONDS } from "@/lib/auth/token";
import { isCronAuthorized } from "@/lib/auth/cron";

const SECRET = "x".repeat(40);

describe("password hashing", () => {
  it("verifies the right password and rejects a wrong one", async () => {
    const hash = await hashPassword("correct horse battery");
    expect(hash.startsWith("scrypt:")).toBe(true);
    expect(hash).not.toContain("$");
    expect(await verifyPassword("correct horse battery", hash)).toBe(true);
    expect(await verifyPassword("correct horse batterY", hash)).toBe(false);
  });

  it("rejects short passwords and malformed hashes", async () => {
    await expect(hashPassword("short")).rejects.toThrow();
    expect(await verifyPassword("anything at all", "not-a-hash")).toBe(false);
    expect(await verifyPassword("anything at all", "scrypt:16384:8:1:00:")).toBe(false);
  });
});

describe("session token", () => {
  it("round-trips", () => {
    const t = createToken("me@example.com", SECRET);
    expect(verifyToken(t, SECRET)?.sub).toBe("me@example.com");
  });

  it("rejects a token signed with another secret", () => {
    const t = createToken("me@example.com", SECRET);
    expect(verifyToken(t, "y".repeat(40))).toBeNull();
  });

  it("rejects a tampered payload", () => {
    const t = createToken("me@example.com", SECRET);
    const [, sig] = t.split(".");
    const forged = Buffer.from(JSON.stringify({ sub: "x", iat: 0, exp: 9e9 })).toString("base64url");
    expect(verifyToken(`${forged}.${sig}`, SECRET)).toBeNull();
  });

  it("expires", () => {
    const now = Date.now();
    const t = createToken("me@example.com", SECRET, now);
    expect(verifyToken(t, SECRET, now + (SESSION_TTL_SECONDS - 1) * 1000)).not.toBeNull();
    expect(verifyToken(t, SECRET, now + (SESSION_TTL_SECONDS + 1) * 1000)).toBeNull();
  });

  it("refuses weak or missing secrets", () => {
    expect(() => createToken("me", "short")).toThrow();
    expect(verifyToken(createToken("me", SECRET), undefined)).toBeNull();
    expect(verifyToken(undefined, SECRET)).toBeNull();
  });
});

describe("cron secret", () => {
  it("accepts only the exact bearer secret", () => {
    expect(isCronAuthorized(`Bearer ${SECRET}`, SECRET)).toBe(true);
    expect(isCronAuthorized(`Bearer ${SECRET}x`, SECRET)).toBe(false);
    expect(isCronAuthorized(SECRET, SECRET)).toBe(false);
    expect(isCronAuthorized(null, SECRET)).toBe(false);
    expect(isCronAuthorized(`Bearer ${SECRET}`, undefined)).toBe(false);
  });
});
