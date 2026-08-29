"use server";

import { requireAdmin } from "@/lib/access";
import { getAllEvents } from "./queries";
import { createEvent } from "./mutations";

export async function getAllEventsAction() {
  await requireAdmin();
  return await getAllEvents();
}

export async function createEventAction(formData: FormData) {
  await requireAdmin();
  return await createEvent(formData);
}
