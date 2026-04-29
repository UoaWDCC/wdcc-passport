import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";

import { authOptions } from "@/auth";

export type UserAccess =
  | { status: "no_role" }
  | { status: "user"; userId: number; email: string }
  | { status: "admin"; userId: number; email: string };

export async function getCurrentUserAccess(): Promise<UserAccess> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.user_id;

  if (!userId) {
    return { status: "no_role" };
  }

  const { adminOf, db, users } = await import("@/db");

  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    return {
      status: "no_role",
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
    };
  }

  return {
    status: "user",
    userId: user.id,
    email: user.email,
  };
}

export async function getSignedInDestination() {
  const access = await getCurrentUserAccess();

  if (access.status === "no_role") {
    return null;
  }

  return access.status === "admin" ? "/admin" : "/user";
}
