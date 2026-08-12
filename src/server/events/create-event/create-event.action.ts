"use server";

import { createEvent } from "@/server/events/create-event/create-event.service";
import { requireAdmin } from "@/lib/access";

export async function createEventAction(formData: FormData) {
  await requireAdmin();

  const name = formData.get("name");
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

  const event = await createEvent({
    name: name.trim(),
    startTimestamp: start,
    endTimestamp: end,
  });

  return event;
}
