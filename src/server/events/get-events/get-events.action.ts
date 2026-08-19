"use server";

import { requireAdmin } from "@/lib/access";
import { getEvents } from "./get-events.service";

export async function getEventsAction() {
  await requireAdmin();
  return getEvents();
}
