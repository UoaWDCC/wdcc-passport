import { db } from "@/lib/db/client";
import { userBadge } from "@/lib/db/schema";

export async function addUserBadge(userId: string, badgeId: string) {
  const [awarded] = await db
    .insert(userBadge)
    .values({ userId, badgeId })
    .onConflictDoNothing()
    .returning();

  return { badgeId, alreadyAwarded: !awarded };
}
