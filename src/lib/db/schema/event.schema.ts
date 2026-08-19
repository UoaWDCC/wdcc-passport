import { sql } from "drizzle-orm";
import { check, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const event = pgTable(
  "event",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    startTimestamp: timestamp("start_timestamp", { withTimezone: true }).notNull(),
    endTimestamp: timestamp("end_timestamp", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check("event_timestamps_check", sql`${table.endTimestamp} > ${table.startTimestamp}`),
  ],
);
