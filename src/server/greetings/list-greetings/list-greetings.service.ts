import "server-only";

import { desc } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { greetings } from "@/lib/db/schema";

import type { Greeting } from "../_shared/greetings.types";

export async function listGreetings(): Promise<Greeting[]> {
  return db.select().from(greetings).orderBy(desc(greetings.createdAt));
}
