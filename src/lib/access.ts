import { headers } from "next/headers";

import { auth, type AppRole } from "@/auth";

export type UserAccess =
  | { status: "no_role" }
  | { status: "user"; userId: number; email: string }
  | { status: "admin"; userId: number; email: string };

function isAppRole(value: string): value is AppRole {
  return value === "user" || value === "admin";
}

export async function getCurrentUserAccess(): Promise<UserAccess> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  console.log(
    "[auth] cookie session payload:",
    JSON.stringify(session, null, 2),
  );

  if (!session?.user?.email) {
    return { status: "no_role" };
  }

  const { appUserId, role } = session.session;

  if (!isAppRole(role)) {
    return { status: "no_role" };
  }

  return {
    status: role,
    userId: appUserId,
    email: session.user.email,
  };
}

export async function getSignedInDestination() {
  const access = await getCurrentUserAccess();

  if (access.status === "no_role") {
    return null;
  }

  return access.status === "admin" ? "/admin" : "/user";
}
