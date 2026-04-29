import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const KNOWN_ROLES = ["admin", "user"] as const;
type KnownRole = (typeof KNOWN_ROLES)[number];

function matches(pathname: string, routes: string[]) {
  return routes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  });

  // Anything that isn't a known role (including undefined or a forged value)
  const rawRole = token?.role;
  const role: KnownRole | "no_role" = KNOWN_ROLES.includes(
    rawRole as KnownRole,
  )
    ? (rawRole as KnownRole)
    : "no_role";

  if (!token || role === "no_role") {
    if (matches(pathname, ["/user", "/admin"])) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (matches(pathname, ["/admin"]) && role !== "admin") {
    return NextResponse.redirect(new URL("/user", request.url));
  }

  if (role === "admin" && matches(pathname, ["/user"])) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/user/:path*", "/admin/:path*"],
};
