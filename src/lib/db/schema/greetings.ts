import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

// Example table for the reference feature slices (server/greetings/*).
// Safe to delete once you have real tables.
export const greetings = pgTable("greetings", {
  id: serial("id").primaryKey(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
