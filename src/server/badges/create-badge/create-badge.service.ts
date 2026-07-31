import { db } from "@/lib/db/client";
import { badge } from "@/lib/db/schema";
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const S3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

export const MAX_BADGE_IMAGE_BYTES = 2 * 1024 * 1024;

async function uploadBadgeImage(badgeId: string, image: File) {
  const extension = IMAGE_EXTENSIONS[image.type];

  if (!extension) {
    throw new Error(`Unsupported badge image type: ${image.type || "unknown"}`);
  }

  if (image.size === 0) {
    throw new Error("Badge image is empty");
  }

  if (image.size > MAX_BADGE_IMAGE_BYTES) {
    throw new Error("Badge image must be 2MB or smaller");
  }

  const key = `badge/${badgeId}.${extension}`;
  const fileContent = Buffer.from(await image.arrayBuffer());

  await S3.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: fileContent,
      ContentType: image.type,
    }),
  );

  return key;
}

export async function createBadge(input: {
  name: string;
  image: File;
  type: "event" | "special";
  eventId?: string | null;
}) {
  const badgeId = crypto.randomUUID();
  const path = await uploadBadgeImage(badgeId, input.image);

  try {
    const [createdBadge] = await db
      .insert(badge)
      .values({
        id: badgeId,
        name: input.name,
        path,
        type: input.type,
        eventId: input.type === "event" ? (input.eventId ?? null) : null,
      })
      .returning();

    return createdBadge;
  } catch (error) {
    await S3.send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: path })).catch(
      (deleteError) => console.error("Failed to clean up badge image", deleteError),
    );

    throw error;
  }
}
