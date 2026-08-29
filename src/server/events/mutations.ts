import { db } from "../db/client";
import { event } from "../db/schema";

const ISO_WITH_OFFSET = /(?:Z|[+-]\d{2}:?\d{2})$/;

export async function createEvent(formData: FormData) {
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
