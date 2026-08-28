"use server";

import { db } from "@/server/db/client";
import { eq } from "drizzle-orm";
import { userBadge, badge } from "@/server/db/schema";
import { NeonDbError } from "@neondatabase/serverless";
import { deleteObject, putObject } from "../r2/storage";
import { randomBytes } from "crypto";
import { requireAdmin, requireUser } from "@/lib/access";
import { createUserBadge } from "./mutations";
import { getUserBadges } from "./queries";

const MAX_BADGE_IMAGE_BYTES = 1 * 1024 * 1024;

export async function createBadgeAction(formData: FormData) {
  await requireAdmin();

  const name = formData.get("name")?.toString().trim();
  const type = formData.get("type");
  const eventId = formData.get("eventId")?.toString().trim();
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


  await createUserBadge(name, type, image, eventId);
  }

export async function getUserBadgesAction() {
  const session = await requireUser();
  const baseUrl = process.env.R2_PUBLIC_BASE_URL;

  if (!baseUrl) {
    throw new Error("R2_PUBLIC_BASE_URL is not set");
  }

  await getUserBadges(baseUrl, session.user.id);
}

export async function addUserBadge(userId: string, badgeId: string) {
  await requireAdmin();
  
  return await addUserBadge(userId, badgeId);
}
