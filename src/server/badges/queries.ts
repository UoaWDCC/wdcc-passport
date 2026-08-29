import { db } from "../db/client";
import { badge, userBadge } from "../db/schema";
import { eq } from "drizzle-orm";

export async function getUserBadges(userId: string) {
  const baseUrl = process.env.R2_PUBLIC_BASE_URL;

  if (!baseUrl) {
    throw new Error("R2_PUBLIC_BASE_URL is not set");
  }

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
