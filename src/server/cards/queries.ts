import { db } from "../db/client";
import { card, Card } from "../db/schema";

const CARDS_PER_PACK = 5;

const RARITY_WEIGHTS: Record<Card["rarity"], number> = {
  common: 50,
  rare: 30,
  epic: 15,
  legendary: 5,
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
  return selectedCards;
}
