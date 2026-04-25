import { cookies } from "next/headers";

const SESSION_COOKIE_NAMES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
] as const;

const ADMIN_ROLE_VALUES = new Set(["admin", "club-admin", "club_admin"]);
const ROLE_COOKIE_NAMES = ["role", "user-role", "user_role"] as const;

export async function isSignedIn() {
  const cookieStore = await cookies();

  return SESSION_COOKIE_NAMES.some((name) => Boolean(cookieStore.get(name)?.value));
}

export async function getSignedInDestination() {
  const cookieStore = await cookies();
  const hasSession = SESSION_COOKIE_NAMES.some((name) =>
    Boolean(cookieStore.get(name)?.value),
  );

  if (!hasSession) {
    return null;
  }

  const role =
    ROLE_COOKIE_NAMES.map((name) => cookieStore.get(name)?.value?.toLowerCase()).find(
      Boolean,
    ) ?? null;

  return role && ADMIN_ROLE_VALUES.has(role) ? "/admin-side" : "/user-side";
}
