import { db } from "@/server/db/client";
import { desc } from "drizzle-orm";
import { event } from "@/server/db/schema";

export async function getEvents() {
  return db
    .select({
      id: event.id,
      name: event.name,
    })
    .from(event)
    .orderBy(desc(event.createdAt));
}
