import { db } from "../db/client";
import { card, Card, userCard } from "../db/schema";
import { and, eq, sql } from "drizzle-orm";

const CARDS_PER_PACK = 5;
const CARD_BACK_PATH = "card/backside.webp";

const RARITY_ORDER: Record<Card["rarity"], number> = {
  common: 0,
  rare: 1,
  epic: 2,
  legendary: 3,
};

const RARITY_WEIGHTS: Record<Card["rarity"], number> = {
  common: 50,
  rare: 30,
  epic: 17,
  legendary: 3,
};

function getRandomRarity(): Card["rarity"] {
  let randomValue = Math.random() * 100;
  for (const [rarity, weight] of Object.entries(RARITY_WEIGHTS)) {
    randomValue -= weight;
    if (randomValue <= 0) {
      return rarity as Card["rarity"];
    }
  }
  return "common";
}

export async function generateCards(): Promise<Card[]> {
  const cardPool = await db.select().from(card);
  if (cardPool.length === 0) {
    throw new Error("No cards available in the database");
  }

  const selectedCards: Card[] = [];

  for (let i = 0; i < CARDS_PER_PACK; i++) {
    const rarity = getRandomRarity();
    const cardsOfRarity = cardPool.filter((c) => c.rarity === rarity);
    const currentSelection = cardsOfRarity.length > 0 ? cardsOfRarity : cardPool;
    selectedCards.push(currentSelection[Math.floor(Math.random() * currentSelection.length)]);
  }

  return selectedCards.sort((a, b) => RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity]);
}

export async function getUserCards(userId: string) {
  const baseUrl = process.env.R2_PUBLIC_BASE_URL;

  if (!baseUrl) {
    throw new Error("R2_PUBLIC_BASE_URL is not set");
  }

  const rows = await db
    .select({
      id: card.id,
      name: card.name,
      rarity: card.rarity,
      imagePath: card.imagePath,
      quantity: sql<number>`coalesce(${userCard.quantity}, 0)`.mapWith(Number),
    })
    .from(card)
    .leftJoin(userCard, and(eq(userCard.cardId, card.id), eq(userCard.userId, userId)))
    .orderBy(card.rarity, card.name);

  return rows.map(({ imagePath, ...c }) => ({
    ...c,
    front: `${baseUrl}/${imagePath}`,
    back: `${baseUrl}/${CARD_BACK_PATH}`,
  }));
}
