import { pgEnum, pgTable, text } from "drizzle-orm/pg-core";

export const rarityEnum = pgEnum("rarity", ["common", "rare", "epic", "legendary"]);

export const card = pgTable("card", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  rarity: rarityEnum("rarity").notNull(),
  description: text("description").notNull(),
  imagePath: text("image_path").notNull(),
});
