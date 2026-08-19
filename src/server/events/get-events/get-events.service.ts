import { db } from "@/lib/db/client";
import { desc } from "drizzle-orm";
import { event } from "@/lib/db/schema";

export async function getEvents() {
  return db
    .select({
      id: event.id,
      name: event.name,
    })
    .from(event)
    .orderBy(desc(event.createdAt));
}
