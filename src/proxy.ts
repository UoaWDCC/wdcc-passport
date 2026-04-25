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
  const role = token?.role;

  // Not signed in — block all protected routes
  if (!token && matches(pathname, ["/user", "/admin", "/sign-up"])) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Signed in but needs sign-up — only allow /sign-up
  if (role === "needs-sign-up" && matches(pathname, ["/user", "/admin"])) {
    return NextResponse.redirect(new URL("/sign-up", request.url));
  }

  // Already set up — redirect away from /sign-up and /admin
  if (
    role === "user" &&
    matches(pathname, ["/sign-up", "/admin"])
  ) {
    return NextResponse.redirect(new URL("/user", request.url));
  }

  //Redirect admin from /sign-up and /user
  if (
    role === "admin" &&
    matches(pathname, ["/sign-up", "/user"])
  ) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/user/:path*", "/admin/:path*", "/sign-up/:path*"],
};
