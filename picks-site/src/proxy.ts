import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifyToken } from "@/lib/auth/token";

// Paths reachable without a session. Cron routes check CRON_SECRET themselves.
const PUBLIC_PATHS = ["/login", "/api/health"];
const CRON_PREFIX = "/api/cron/";

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (PUBLIC_PATHS.includes(pathname) || pathname.startsWith(CRON_PREFIX)) {
    return NextResponse.next();
  }

  const session = verifyToken(request.cookies.get(SESSION_COOKIE)?.value, process.env.AUTH_SECRET);
  const owner = process.env.AUTH_EMAIL?.trim().toLowerCase();
  if (session && owner && session.sub === owner) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const login = new URL("/login", request.url);
  if (pathname !== "/") login.searchParams.set("next", pathname + search);
  return NextResponse.redirect(login);
}

export const config = {
  // Everything except Next's static assets and the favicon.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
