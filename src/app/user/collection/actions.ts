"use server";

import { randomBytes } from "node:crypto";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { cards, db, userCollection, userPackCards, userPacks } from "@/db";
import { getCurrentUserAccess } from "@/lib/access";
import { RARITY_ORDER } from "@/lib/rarity";

const PACK_SIZE = 5;

async function getRandomSeededCards(size: number) {
  const seededCards = await db
    .select({
      cardId: cards.id,
      rarity: cards.rarity,
    })
    .from(cards);

  if (seededCards.length < size) {
    throw new Error("Not enough seeded cards to generate a pack");
  }

  const remaining = [...seededCards];
  const selected: typeof seededCards = [];

  while (selected.length < size) {
    const index = Math.floor(Math.random() * remaining.length);
    const [card] = remaining.splice(index, 1);
    selected.push(card);
  }

  return selected;
}

export async function generateRandomPack() {
  const access = await getCurrentUserAccess();
  if (access.status === "no_role") {
    throw new Error("Not authenticated");
  }

  const packCards = await getRandomSeededCards(PACK_SIZE);

  if (packCards.length !== PACK_SIZE) {
    throw new Error("Could not generate a full pack");
  }

  // Reserved for QR scan redemption; random admin packs are not redeemed by token yet.
  const scanToken = randomBytes(16).toString("hex");

  const [pack] = await db
    .insert(userPacks)
    .values({
      userId: access.userId,
      eventId: null,
      scanToken,
    })
    .returning({ id: userPacks.id });

  await db.insert(userPackCards).values(
    packCards.map(({ cardId, rarity }, idx) => ({
      packId: pack.id,
      cardId,
      rarity,
      slot: idx + 1,
    })),
  );

  revalidatePath("/user/collection");
}

export type RevealedCard = {
  cardId: number;
  name: string;
  rarity: string;
  imageUrl: string | null;
};

export async function openPack(packId: number): Promise<RevealedCard[]> {
  const access = await getCurrentUserAccess();
  if (access.status === "no_role") {
    throw new Error("Not authenticated");
  }

  const sorted = await db.transaction(async (tx) => {
    const [claimedPack] = await tx
      .update(userPacks)
      .set({ openedAt: new Date() })
      .where(
        and(
          eq(userPacks.id, packId),
          eq(userPacks.userId, access.userId),
          isNull(userPacks.openedAt),
        ),
      )
      .returning({ id: userPacks.id });

    if (!claimedPack) {
      throw new Error("Pack not found or already opened");
    }

    const packCards = await tx
      .select({
        cardId: cards.id,
        name: cards.name,
        rarity: cards.rarity,
        imageUrl: cards.imageUrl,
        slot: userPackCards.slot,
      })
      .from(userPackCards)
      .innerJoin(cards, eq(cards.id, userPackCards.cardId))
      .where(eq(userPackCards.packId, packId));

    if (packCards.length === 0) {
      throw new Error("Pack has no cards");
    }

    const revealedCards = [...packCards].sort((a, b) => {
      const ra = RARITY_ORDER[a.rarity] ?? 99;
      const rb = RARITY_ORDER[b.rarity] ?? 99;
      if (ra !== rb) return ra - rb;
      return a.slot - b.slot;
    });

    await tx.insert(userCollection).values(
      revealedCards.map((c) => ({
        userId: access.userId,
        cardId: c.cardId,
        rarity: c.rarity,
        fromPack: packId,
      })),
    );

    return revealedCards;
  });

  return sorted;
}
