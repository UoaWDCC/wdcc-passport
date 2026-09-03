import { sql } from "drizzle-orm";
import { db } from "../db/client";
import { userPack } from "../db/schema";

export async function addUserPack(userId: string) {
  await db
    .insert(userPack)
    .values({ userId, packQuantity: 1 })
    .onConflictDoUpdate({
      target: userPack.userId,
      set: { packQuantity: sql`${userPack.packQuantity} + 1` },
    });
}
