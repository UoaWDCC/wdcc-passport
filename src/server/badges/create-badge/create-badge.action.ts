"use server";

import { createBadge } from "@/server/badges/create-badge/create-badge.service";
import { requireAdmin } from "@/lib/access";

export async function createBadgeAction() {
  await requireAdmin();
  const badge = await createBadge({
    name: "Test Badge",
    path: "@/public/test.jpg",
    type: "special",
    eventId: null,
  });
  console.log(badge);
  return badge;
}
