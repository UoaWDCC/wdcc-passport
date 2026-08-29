import { db } from "../db/client";
import { desc } from "drizzle-orm";
import { event } from "../db/schema";

export async function getAllEvents() {
  return db
    .select({
      id: event.id,
      name: event.name,
    })
    .from(event)
    .orderBy(desc(event.createdAt));
}
