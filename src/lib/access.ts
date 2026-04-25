import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";

export type UserAccess =
  | { status: "signed-out" }
  | { status: "needs-sign-up"; email: string; name: string | null }
  | { status: "user"; userId: number; email: string; name: string }
  | { status: "admin"; userId: number; email: string; name: string };

export async function isSignedIn() {
  const session = await getServerSession(authOptions);

  return Boolean(session?.user?.email);
}

export async function getCurrentUserAccess(): Promise<UserAccess> {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return { status: "signed-out" };
  }

  const { adminOf, db, users } = await import("@/db");

  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    return {
      status: "needs-sign-up",
      email,
      name: session.user?.name ?? null,
    };
  }

  const [adminClub] = await db
    .select({ clubId: adminOf.clubId })
    .from(adminOf)
    .where(eq(adminOf.userId, user.id))
    .limit(1);

  if (adminClub) {
    return {
      status: "admin",
      userId: user.id,
      email: user.email,
      name: user.name,
    };
  }

  return {
    status: "user",
    userId: user.id,
    email: user.email,
    name: user.name,
  };
}

export async function getSignedInDestination() {
  const access = await getCurrentUserAccess();

  if (access.status === "signed-out") {
    return null;
  }

  if (access.status === "needs-sign-up") {
    return "/sign-up";
  }

  return access.status === "admin" ? "/admin" : "/user";
}
