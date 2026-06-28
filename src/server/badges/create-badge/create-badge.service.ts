import { db } from "@/lib/db/client";
import { badge } from "@/lib/db/schema";

export async function createBadge(input: {
  name: string;
  path: string;
  type: "event" | "special";
  eventId?: string | null;
}) {
  const [createdBadge] = await db
    .insert(badge)
    .values({
      id: crypto.randomUUID(),
      name: input.name,
      path: input.path,
      type: input.type,
      eventId: input.type === "event" ? (input.eventId ?? null) : null,
    })
    .returning();

  return createdBadge;
}
