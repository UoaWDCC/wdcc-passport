import { eq } from "drizzle-orm/sql/expressions/conditions";
import { db } from "../db/client";
import { badge, event } from "../db/schema";

const ISO_WITH_OFFSET = /(?:Z|[+-]\d{2}:?\d{2})$/;

function parseEventFormData(formData: FormData) {
  const name = formData.get("name")?.toString().trim();
  const startTimestamp = formData.get("startTimestamp");
  const endTimestamp = formData.get("endTimestamp");

  if (typeof name !== "string" || name.trim() === "") {
    throw new Error("Event name is required");
  }

  if (typeof startTimestamp !== "string" || startTimestamp.trim() === "") {
    throw new Error("Event start time is required");
  }

  if (typeof endTimestamp !== "string" || endTimestamp.trim() === "") {
    throw new Error("Event end time is required");
  }

  if (!ISO_WITH_OFFSET.test(startTimestamp)) {
    throw new Error("Event start time must include a UTC offset");
  }

  if (!ISO_WITH_OFFSET.test(endTimestamp)) {
    throw new Error("Event end time must include a UTC offset");
  }

  const start = new Date(startTimestamp);
  const end = new Date(endTimestamp);

  if (Number.isNaN(start.getTime())) {
    throw new Error("Event start time is invalid");
  }

  if (Number.isNaN(end.getTime())) {
    throw new Error("Event end time is invalid");
  }

  if (end <= start) {
    throw new Error("Event end time must be after the start time");
  }

  return { name, start, end };
}

export async function createEvent(formData: FormData) {
  const { name, start, end } = parseEventFormData(formData);

  const [createdEvent] = await db
    .insert(event)
    .values({
      id: crypto.randomUUID(),
      name: name,
      startTimestamp: start,
      endTimestamp: end,
    })
    .returning({
      id: event.id,
      name: event.name,
      startTimestamp: event.startTimestamp,
      endTimestamp: event.endTimestamp,
    });

  return createdEvent;
}

export async function updateEvent(formData: FormData) {
  const id = formData.get("id")?.toString().trim();

  if (typeof id !== "string" || id.trim() === "") {
    throw new Error("Event ID is required");
  }

  const { name, start, end } = parseEventFormData(formData);

  const [updatedEvent] = await db
    .update(event)
    .set({
      name: name,
      startTimestamp: start,
      endTimestamp: end,
    })
    .where(eq(event.id, id))
    .returning({
      id: event.id,
      name: event.name,
      startTimestamp: event.startTimestamp,
      endTimestamp: event.endTimestamp,
    });

  if (!updatedEvent) throw new Error("Event not found");

  return updatedEvent;
}

export async function deleteEvent(eventId: string) {
  if (typeof eventId !== "string" || eventId.trim() === "") {
    throw new Error("Event id is required");
  }

  const [linkedBadge] = await db
    .select({ id: badge.id })
    .from(badge)
    .where(eq(badge.eventId, eventId))
    .limit(1);

  if (linkedBadge) throw new Error("Delete the event's badge before deleting the event");

  const [deletedEvent] = await db
    .delete(event)
    .where(eq(event.id, eventId))
    .returning({ id: event.id });

  if (!deletedEvent) throw new Error("Event not found");

  return deletedEvent;
}
