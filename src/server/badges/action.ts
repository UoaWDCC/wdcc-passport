"use server";

import { db } from "@/server/db/client";
import { eq } from "drizzle-orm";
import { userBadge, badge } from "@/server/db/schema";
import { NeonDbError } from "@neondatabase/serverless";
import { deleteObject, putObject } from "../r2/storage";
import { randomBytes } from "crypto";
import { requireAdmin, requireUser } from "@/lib/access";

const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

const MAX_BADGE_IMAGE_BYTES = 1 * 1024 * 1024;
const RETRY_LIMIT = 6;

function isBadgeCodeCollision(error: unknown) {
  return (
    error instanceof Error &&
    error.cause instanceof NeonDbError &&
    error.cause.code === "23505" &&
    error.cause.constraint === "badge_code_unique"
  );
}

async function uploadBadgeImage(badgeId: string, image: File) {
  const extension = IMAGE_EXTENSIONS[image.type];

  if (!extension) {
    throw new Error(`Unsupported badge image type: ${image.type || "unknown"}`);
  }

  if (image.size === 0) {
    throw new Error("Badge image is empty");
  }

  if (image.size > MAX_BADGE_IMAGE_BYTES) {
    throw new Error("Badge image must be 1MB or smaller");
  }

  const key = `badge/${badgeId}.${extension}`;
  const fileContent = Buffer.from(await image.arrayBuffer());

  return putObject(key, fileContent, image.type);
}

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

  const badgeId = crypto.randomUUID();
  const path = await uploadBadgeImage(badgeId, image);
  let count = 0;

  while (count < RETRY_LIMIT) {
    try {
      count++;
      const [createdBadge] = await db
        .insert(badge)
        .values({
          id: badgeId,
          code: randomBytes(3).toString("hex"),
          name: name,
          path,
          type: type,
          eventId: type === "event" ? (eventId ?? null) : null,
        })
        .returning();

      return createdBadge;
    } catch (error) {
      if (isBadgeCodeCollision(error)) {
        continue;
      }

      await deleteObject(path).catch((deleteError) =>
        console.error("Failed to clean up badge image", deleteError),
      );

      throw error;
    }
  }

  await deleteObject(path).catch((deleteError) =>
    console.error("Failed to clean up badge image", deleteError),
  );

  throw new Error("Failed to generate a unique badge code");
}
export async function getUserBadgesAction() {
  const session = await requireUser();
  const baseUrl = process.env.R2_PUBLIC_BASE_URL;

  if (!baseUrl) {
    throw new Error("R2_PUBLIC_BASE_URL is not set");
  }

  const rows = await db
    .select({
      id: badge.id,
      name: badge.name,
      path: badge.path,
      awardedAt: userBadge.awardedAt,
    })
    .from(userBadge)
    .innerJoin(badge, eq(userBadge.badgeId, badge.id))
    .where(eq(userBadge.userId, session.user.id))
    .orderBy(badge.name);

  return rows.map((b) => ({
    ...b,
    path: `${baseUrl}/${b.path}`,
  }));
}

export async function addUserBadge(userId: string, badgeId: string) {
  await requireAdmin();
  const [awarded] = await db
    .insert(userBadge)
    .values({ userId, badgeId })
    .onConflictDoNothing()
    .returning();

  return { badgeId, alreadyAwarded: !awarded };
}
