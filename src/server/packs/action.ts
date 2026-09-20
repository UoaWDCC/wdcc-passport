"use server";

import { requireUser } from "@/lib/access";
import { openPack } from "./mutation";
import { generateCards } from "../cards/queries";
import { getUserPackCount } from "./queries";

const CARD_BACK_PATH = "card/backside.webp";

export async function openPackAction() {
  const session = await requireUser();

  const baseUrl = process.env.R2_PUBLIC_BASE_URL;

  if (!baseUrl) {
    throw new Error("R2_PUBLIC_BASE_URL is not set");
  }

  const cards = await generateCards();
  const result = await openPack(session.user.id, cards);

  if (!result) {
    throw new Error("No packs available to open.");
  }

  return cards.map(({ imagePath, ...c }) => ({
    ...c,
    front: `${baseUrl}/${imagePath}`,
    back: `${baseUrl}/${CARD_BACK_PATH}`,
  }));
}

export async function getUserPackCountAction() {
  const session = await requireUser();

  return getUserPackCount(session.user.id);
}
