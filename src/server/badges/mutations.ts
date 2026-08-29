import { randomBytes } from "crypto";
import { db } from "../db/client";
import { badge, userBadge } from "../db/schema";
import { deleteObject, putObject } from "../r2/storage";
import { NeonDbError } from "@neondatabase/serverless";

const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

const MAX_BADGE_IMAGE_BYTES = 1 * 1024 * 1024;
const RETRY_LIMIT = 6;

export function isBadgeCodeCollision(error: unknown) {
  return (
    error instanceof Error &&
    error.cause instanceof NeonDbError &&
    error.cause.code === "23505" &&
    error.cause.constraint === "badge_code_unique"
  );
}

export async function uploadBadgeImage(badgeId: string, image: File) {
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

export async function createUserBadge(formData: FormData) {
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
  let count = 0;
  const path = await uploadBadgeImage(badgeId, image);

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

export async function addUserBadge(userId: string, badgeId: string) {
  const [awarded] = await db
    .insert(userBadge)
    .values({ userId, badgeId })
    .onConflictDoNothing()
    .returning();

  return { badgeId, alreadyAwarded: !awarded };
}
