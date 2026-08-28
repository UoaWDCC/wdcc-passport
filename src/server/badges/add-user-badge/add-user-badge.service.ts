import { db } from "@/server/db/client";
import { userBadge } from "@/server/db/schema";

export async function addUserBadge(userId: string, badgeId: string) {
  const [awarded] = await db
    .insert(userBadge)
    .values({ userId, badgeId })
    .onConflictDoNothing()
    .returning();

  return { badgeId, alreadyAwarded: !awarded };
}
