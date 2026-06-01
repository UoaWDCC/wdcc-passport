import { pgEnum, pgTable, text } from "drizzle-orm/pg-core";

import { event } from "./event.schema";

export const badgeType = pgEnum("badge_type", ["event", "special"]);

export const badge = pgTable("badge", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  path: text("path").notNull(),
  type: badgeType("type").notNull(),
  eventId: text("event_id").references(() => event.id),
});
