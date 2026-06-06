import { db } from "@/lib/db/client";
import { eq } from "drizzle-orm";
import { userBadge, badge } from "@/lib/db/schema";

export async function getUserBadges(userId: string) {
  return db
    .select({
      id: badge.id,
      name: badge.name,
      path: badge.path,
      awardedAt: userBadge.awardedAt,
    })
    .from(userBadge)
    .innerJoin(badge, eq(userBadge.badgeId, badge.id))
    .where(eq(userBadge.userId, userId));
}
