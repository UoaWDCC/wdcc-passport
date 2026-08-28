import { db } from "@/server/db/client";
import { badge } from "@/server/db/schema";
import { deleteObject, putObject } from "@/server/r2/storage";
import { NeonDbError } from "@neondatabase/serverless";
import { randomBytes } from "crypto";

const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

export const MAX_BADGE_IMAGE_BYTES = 1 * 1024 * 1024;
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

export async function createBadge(input: {
  name: string;
  image: File;
  type: "event" | "special";
  eventId?: string | null;
}) {
  const badgeId = crypto.randomUUID();
  const path = await uploadBadgeImage(badgeId, input.image);
  let count = 0;

  while (count < RETRY_LIMIT) {
    try {
      count++;
      const [createdBadge] = await db
        .insert(badge)
        .values({
          id: badgeId,
          code: randomBytes(3).toString("hex"),
          name: input.name,
          path,
          type: input.type,
          eventId: input.type === "event" ? (input.eventId ?? null) : null,
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
