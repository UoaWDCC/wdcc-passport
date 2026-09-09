"use server";

import { requireAdmin } from "@/lib/access";
import { getAllEvents } from "./queries";
import { createEvent, deleteEvent, updateEvent } from "./mutations";

export async function getAllEventsAction() {
  await requireAdmin();
  return await getAllEvents();
}

export async function createEventAction(formData: FormData) {
  await requireAdmin();
  return await createEvent(formData);
}

export async function updateEventAction(formData: FormData) {
  await requireAdmin();
  return await updateEvent(formData);
}

export async function deleteEventAction(eventId: string) {
  await requireAdmin();
  return await deleteEvent(eventId);
}
