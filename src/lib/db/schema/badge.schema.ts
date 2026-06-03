import { sql } from "drizzle-orm";
import { check, index, pgEnum, pgTable, text } from "drizzle-orm/pg-core";

import { event } from "./event.schema";

export const badgeType = pgEnum("badge_type", ["event", "special"]);

export const badge = pgTable(
  "badge",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    path: text("path").notNull(),
    type: badgeType("type").notNull(),
    eventId: text("event_id").references(() => event.id, {
      onDelete: "cascade",
    }),
  },
  (table) => [
    index("badge_eventId_idx").on(table.eventId),
    check(
      "badge_type_event_id_check",
      sql`(${table.type} = 'event' and ${table.eventId} is not null) or (${table.type} = 'special' and ${table.eventId} is null)`,
    ),
  ],
);
