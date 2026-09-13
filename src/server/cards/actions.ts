"use server";

import { requireUser } from "@/lib/access";
import { getUserCards } from "./queries";

export async function getUserCardsAction() {
  const session = await requireUser();

  return await getUserCards(session.user.id);
}
