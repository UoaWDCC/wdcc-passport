"use server";

import { createBadge } from "@/server/badges/create-badge/create-badge.service";
import { requireAdmin } from "@/lib/access";

export async function createBadgeAction(formData: FormData) {
  await requireAdmin();

  const name = formData.get("name");
  const type = formData.get("type");
  const eventId = formData.get("eventId");
  const image = formData.get("image");

  if (typeof name !== "string" || name.trim() === "") {
    throw new Error("Badge name is required");
  }

  if (type !== "event" && type !== "special") {
    throw new Error("Badge type must be 'event' or 'special'");
  }

  if (!(image instanceof File)) {
    throw new Error("Badge image is required");
  }

  if (type === "event" && (typeof eventId !== "string" || eventId.trim() === "")) {
    throw new Error("Event badges need an event");
  }

  const badge = await createBadge({
    name: name.trim(),
    image,
    type,
    eventId: typeof eventId === "string" ? eventId.trim() || null : null,
  });

  return badge;
}
