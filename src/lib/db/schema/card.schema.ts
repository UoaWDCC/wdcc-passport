import { pgTable, text } from "drizzle-orm/pg-core";

export const card = pgTable(
  "card",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    rarity: text("rarity").notNull(),
    path: text("image_path").notNull(),
    // eventId: text("event_id").references(() => event.id, {
    //   onDelete: "cascade",
    // }
  });