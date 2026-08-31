import { integer, pgTable, primaryKey, text } from "drizzle-orm/pg-core";
import { user } from "./user.schema";
import { card } from "./card.schema";

export const userCard = pgTable(
  "user_card",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, {
        onDelete: "cascade",
      }),
    cardId: text("card_id")
      .notNull()
      .references(() => card.id, {
        onDelete: "cascade",
      }),
    quantity: integer("quantity").notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.cardId] })],
);
