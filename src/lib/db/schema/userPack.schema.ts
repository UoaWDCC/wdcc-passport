import { pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./user.schema";

export const userPack = pgTable(
  "user_pack",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    grantedAt: timestamp("granted_at").notNull().defaultNow(),
  },
    (t) => [primaryKey({ columns: [t.userId, t.id] })]
    )