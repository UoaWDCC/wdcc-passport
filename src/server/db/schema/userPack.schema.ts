import { integer, pgTable, text } from "drizzle-orm/pg-core";
import { user } from "./user.schema";

export const userPack = pgTable("userPack", {
    userId: text("user_id")
      .primaryKey()
      .references(() => user.id, { onDelete: "cascade" }),
    packQuantity: integer("pack_quantity").notNull(),
  });
