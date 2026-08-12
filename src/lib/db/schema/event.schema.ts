import { sql } from "drizzle-orm";
import { check, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const event = pgTable(
  "event",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    startTimestamp: timestamp("start_timestamp").notNull(),
    endTimestamp: timestamp("end_timestamp").notNull(),
    qrCodeUuid: uuid("qr_code_uuid").notNull().defaultRandom().unique(),
    sixDigitCode: text("six_digit_code").notNull().unique(),
  },
  (table) => [
    check("event_end_after_start_check", sql`${table.endTimestamp} > ${table.startTimestamp}`),
    check("event_six_digit_code_check", sql`${table.sixDigitCode} ~ '^[A-Z0-9]{6}$'`),
  ],
);
