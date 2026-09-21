import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "@/lib/auth";

export type UserRole = "admin" | "user";

/** Only allow same-site paths (blocks `//evil.com` and absolute URLs). */
export function safeRedirectPath(value: string | undefined) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : null;
}

// Share the session check between layouts and pages within one server render only.
export const requireUser = cache(async () => {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });

  if (!session) {
    const redirectPath = safeRedirectPath(requestHeaders.get("x-pathname") ?? undefined);
    redirect(
      redirectPath && redirectPath !== "/" ? `/?next=${encodeURIComponent(redirectPath)}` : "/",
    );
  }

  return session;
});

export async function requireAdmin() {
  const session = await requireUser();

  if (session.user.role !== "admin") {
    console.log("User is not Admin");
    redirect("/home");
  }

  return session;
}
