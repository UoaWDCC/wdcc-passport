import { db } from "../db/client";
import { badge, userBadge } from "../db/schema";
import { eq } from "drizzle-orm";

export async function getUserBadges(baseUrl: string, userId: string) {
    const rows = await db
        .select({
          id: badge.id,
          name: badge.name,
          path: badge.path,
          awardedAt: userBadge.awardedAt,
        })
        .from(userBadge)
        .innerJoin(badge, eq(userBadge.badgeId, badge.id))
        .where(eq(userBadge.userId, userId))
        .orderBy(badge.name);
    
      return rows.map((b) => ({
        ...b,
        path: `${baseUrl}/${b.path}`,
      }));
}

export async function addUserBadge(userId: string, badgeId: string) {
    const [awarded] = await db
    .insert(userBadge)  
    .values({ userId, badgeId })
    .onConflictDoNothing()
    .returning();

  return { badgeId, alreadyAwarded: !awarded };
}