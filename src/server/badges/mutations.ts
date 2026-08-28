import { randomBytes } from "crypto";
import { db } from "../db/client";
import { badge } from "../db/schema";
import { isBadgeCodeCollision } from "./action";
import { deleteObject, putObject } from "../r2/storage";
import image from "next/image";
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

export async function createUserBadge(name: string,  type: "event" | "special", image: File, eventId?: string) {
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