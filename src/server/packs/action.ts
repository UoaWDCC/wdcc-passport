"use server";

import { requireUser } from "@/lib/access";
import { openPack } from "./mutation";
import { addUserCards } from "../cards/mutation";
import { generateCards } from "../cards/queries";

export async function openPackAction() {
  const session = await requireUser();
  const result = await openPack(session.user.id);

  if(!result){
    throw new Error("No packs available to open.");
  }
  
  const cards = await generateCards();
  await addUserCards(session.user.id, cards);
  return cards;
}
