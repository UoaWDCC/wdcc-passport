import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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
  const role = token?.role ?? "no_role";

  // Not signed in, or signed in without an app role — block protected routes.
  if (
    (!token || role === "no_role") &&
    matches(pathname, ["/user", "/admin"])
  ) {
    return NextResponse.redirect(new URL("/", request.url));
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
