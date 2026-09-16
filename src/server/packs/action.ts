"use server";

import { requireUser } from "@/lib/access";
import { openPack } from "./mutation";
import { generateCards } from "../cards/queries";
import { getUserPackCount } from "./queries";

export async function openPackAction() {
  const session = await requireUser();
  const cards = await generateCards();
  const result = await openPack(session.user.id, cards);

  if (!result) {
    throw new Error("No packs available to open.");
  }

  return cards;
}

export async function getUserPackCountAction() {
  const session = await requireUser();

  return getUserPackCount(session.user.id);
}
