import { and, eq, gt, sql } from "drizzle-orm";
import { db } from "../db/client";
import { userPack } from "../db/schema";

export async function openPack(userId: string) {
  const [result] = await db
    .update(userPack)
    .set({ packQuantity: sql`packQuantity - 1` })
    .where(and(eq(userPack.userId, userId), gt(userPack.packQuantity, 0)))
    .returning({ packQuantity: userPack.packQuantity });

    return result;
}
