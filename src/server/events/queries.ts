import { db } from "../db/client";
import { desc, eq } from "drizzle-orm";
import { badge, event } from "../db/schema";

export async function getAllEvents() {
  return db
    .select({
      id: event.id,
      name: event.name,
      startTimestamp: event.startTimestamp,
      endTimestamp: event.endTimestamp,
      badgeCode: badge.code,
    })
    .from(event)
    .leftJoin(badge, eq(badge.eventId, event.id))
    .orderBy(desc(event.createdAt));
}
