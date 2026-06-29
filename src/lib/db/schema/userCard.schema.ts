import { pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";
    
import { user } from "./user.schema";
import { card } from "./card.schema";

export const userCard = pgTable(
  "user_card",
  {
    cardId: text("card_id")
          .notNull()
          .references(() => card.id, { onDelete: "cascade" }),
    userId: text("user_id")
          .notNull()
          .references(() => user.id, { onDelete: "cascade" }),
    aquiredAt: timestamp("awarded_at").notNull().defaultNow(),
    },
    (t) => [primaryKey({ columns: [t.userId, t.cardId] })]
    )