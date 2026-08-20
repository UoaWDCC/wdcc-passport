import { eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { badge, userBadge } from "@/lib/db/schema";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function scanQr(code: string, userId: string) {
  const isUuid = UUID_REGEX.test(code);

  if (!isUuid && code.length !== 6) {
    throw new Error("Invalid QR code");
  }

  const [matchedBadge] = await db
    .select()
    .from(badge)
    .where(isUuid ? eq(badge.id, code) : eq(badge.code, code))
    .limit(1);

  if (!matchedBadge) {
    throw new Error("Badge not found");
  }

  return { badge: matchedBadge };
}
