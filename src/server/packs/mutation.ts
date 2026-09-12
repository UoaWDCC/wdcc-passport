import { and, eq, gt, sql } from "drizzle-orm";
import { db } from "../db/client";
import { Card, userCard, userPack } from "../db/schema";

export async function openPack(userId: string, cards: Card[]) {
  const opened = db.$with("opened").as(
    db
      .update(userPack)
      .set({ packQuantity: sql`${userPack.packQuantity} - 1` })
      .where(and(eq(userPack.userId, userId), gt(userPack.packQuantity, 0)))
      .returning({ userId: userPack.userId }),
  );

  const drawn = sql`(values ${sql.join(
    [...new Set(cards.map((card) => card.id))].map((id) => sql`(${id})`),
    sql`, `,
  )}) as drawn(card_id)`;

  const inserted = await db
    .with(opened)
    .insert(userCard)
    .select((qb) =>
      qb
        .select({
          userId: opened.userId,
          cardId: sql<string>`drawn.card_id`.as("card_id"),
          //apparnetly drizzle doesn't support default values on insert
          acquiredAt: sql<Date>`now()`.as("acquired_at"),
        })
        .from(opened)
        .crossJoin(drawn),
    )
    .onConflictDoUpdate({
      target: [userCard.userId, userCard.cardId],
      //update aquiredAt to existing value to return rows making return true
      set: { acquiredAt: sql`${userCard.acquiredAt}` },
    })
    .returning({ cardId: userCard.cardId });

  return inserted.length > 0;
}
