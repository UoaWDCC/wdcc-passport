import { Card, userCard } from "../db/schema";
import { sql } from "drizzle-orm";
  import { db } from "../db/client";

export async function addUserCards(userId: string, cards: Card[]) {
    const counts = new Map<string, number>();
    for (const c of cards) counts.set(c.id, (counts.get(c.id) ?? 0) + 1);

    for (const [cardId, quantity] of counts) {
      await db
        .insert(userCard)
        .values({ userId, cardId, quantity })
        .onConflictDoUpdate({
          target: [userCard.userId, userCard.cardId],
          set: { quantity: sql`${userCard.quantity} + excluded.quantity` },
        });
    }
}