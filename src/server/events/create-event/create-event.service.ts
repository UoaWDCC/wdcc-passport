import { db } from "@/lib/db/client";
import { event } from "@/lib/db/schema";

export async function createEvent(input: {
  name: string;
  startTimestamp: Date;
  endTimestamp: Date;
}) {
  const [createdEvent] = await db
    .insert(event)
    .values({
      id: crypto.randomUUID(),
      name: input.name,
      startTimestamp: input.startTimestamp,
      endTimestamp: input.endTimestamp,
    })
    .returning({
      id: event.id,
      name: event.name,
      startTimestamp: event.startTimestamp,
      endTimestamp: event.endTimestamp,
    });

  return createdEvent;
}
