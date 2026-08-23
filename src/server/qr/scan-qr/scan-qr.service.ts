import { eq } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { badge } from "@/lib/db/schema";

export async function scanQr(code: string) {
  const [matchedBadge] = await db.select().from(badge).where(eq(badge.code, code)).limit(1);

  if (!matchedBadge) {
    throw new Error("Badge not found");
  }

  return { badge: matchedBadge };
}
