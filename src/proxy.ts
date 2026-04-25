import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_ROUTES = ["/sign-in"];
const PROTECTED_ROUTES = ["/user", "/admin", "/sign-up"];

function matchesRoute(pathname: string, routes: string[]) {
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
  const isSignedIn = Boolean(token?.email);

  if (matchesRoute(pathname, PROTECTED_ROUTES) && !isSignedIn) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (matchesRoute(pathname, AUTH_ROUTES) && isSignedIn) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/user/:path*", "/admin/:path*", "/sign-up/:path*", "/sign-in"],
};
