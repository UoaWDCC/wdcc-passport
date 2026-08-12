import { db } from "@/lib/db/client";
import { event } from "@/lib/db/schema";

const CODE_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export const SIX_DIGIT_CODE_LENGTH = 6;

function generateSixDigitCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(SIX_DIGIT_CODE_LENGTH));

  return Array.from(bytes, (byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length]).join("");
}

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
      //qr code inserted auto by neon
      sixDigitCode: generateSixDigitCode(),
    })
    .returning();

  return createdEvent;
}
