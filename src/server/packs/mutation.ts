import { and, eq, gt, sql } from "drizzle-orm";
import { db } from "../db/client";
import { Card, userCard, userPack } from "../db/schema";

export async function openPack(userId: string, cards: Card[]) {
  const counts = new Map<string, number>();
  for (const c of cards) counts.set(c.id, (counts.get(c.id) ?? 0) + 1);

  const opened = db.$with("opened").as(
    db
      .update(userPack)
      .set({ packQuantity: sql`${userPack.packQuantity} - 1` })
      .where(and(eq(userPack.userId, userId), gt(userPack.packQuantity, 0)))
      .returning({ userId: userPack.userId }),
  );

  const drawn = sql`(values ${sql.join(
    [...counts].map(([cardId, quantity]) => sql`(${cardId}, ${quantity}::int)`),
    sql`, `,
  )}) as drawn(card_id, quantity)`;

  const inserted = await db
    .with(opened)
    .insert(userCard)
    .select((qb) =>
      qb
        .select({
          userId: opened.userId,
          cardId: sql<string>`drawn.card_id`.as("card_id"),
          quantity: sql<number>`drawn.quantity`.as("quantity"),
        })
        .from(opened)
        .crossJoin(drawn),
    )
    .onConflictDoUpdate({
      target: [userCard.userId, userCard.cardId],
      set: { quantity: sql`${userCard.quantity} + excluded.quantity` },
    })
    .returning({ cardId: userCard.cardId });

  return inserted.length > 0;
}
