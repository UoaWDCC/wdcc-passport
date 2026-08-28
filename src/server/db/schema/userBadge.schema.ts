import { pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./user.schema";
import { badge } from "./badge.schema";

export const userBadge = pgTable(
  "user_badge",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    badgeId: text("badge_id")
      .notNull()
      .references(() => badge.id, { onDelete: "cascade" }),
    awardedAt: timestamp("awarded_at").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.badgeId] })],
);
