import { index, integer, pgTable, text } from "drizzle-orm/pg-core";
import { user } from "./user.schema";

export const unopenedPack = pgTable(
  "unopened_pack",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, {
        onDelete: "cascade",
      }),
    imagePath: text("image_path").notNull(),
    packQuantity: integer("pack_quantity").notNull(),
  },
  (t) => [index("unopened_pack_userId_idx").on(t.userId)],
);
