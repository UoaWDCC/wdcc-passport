"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createGreeting } from "./create-greeting.service";

import type { Greeting } from "../_shared/greetings.types";

const createGreetingSchema = z.object({
  message: z.string().trim().min(1).max(280),
});

export type CreateGreetingInput = z.infer<typeof createGreetingSchema>;

export async function createGreetingAction(
  input: CreateGreetingInput,
): Promise<Greeting> {
  // Validation (and auth/authz) belong at this boundary, not in the service.
  const data = createGreetingSchema.parse(input);

  const greeting = await createGreeting(data);

  revalidatePath("/");

  return greeting;
}
