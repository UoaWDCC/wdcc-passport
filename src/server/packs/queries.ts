import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { userPack } from "../db/schema";

export async function getUserPackCount(userId: string) {
  const count = await db
    .select({ packQuantity: userPack.packQuantity })
    .from(userPack)
    .where(eq(userPack.userId, userId))
    .limit(1);

  return count.length > 0 ? count[0].packQuantity : 0;
}
