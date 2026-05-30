"use server";

import { listGreetings } from "./list-greetings.service";

import type { Greeting } from "../_shared/greetings.types";

export async function listGreetingsAction(): Promise<Greeting[]> {
  // Add auth/authz here if reads should be gated — actions are reachable via
  // direct POST, not just through your UI.
  return listGreetings();
}
