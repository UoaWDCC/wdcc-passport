import { pgTable, text } from "drizzle-orm/pg-core";

export const event = pgTable("event", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
});
