import "server-only";

import { db } from "@/lib/db/client";
import { greetings } from "@/lib/db/schema";

import type { Greeting } from "../_shared/greetings.types";

export async function createGreeting(input: {
  message: string;
}): Promise<Greeting> {
  const [greeting] = await db
    .insert(greetings)
    .values({ message: input.message })
    .returning();

  return greeting;
}
