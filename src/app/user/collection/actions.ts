"use server";

import { randomBytes } from "node:crypto";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { cards, db, userCollection, userPackCards, userPacks } from "@/db";
import { getCurrentUserAccess } from "@/lib/access";
import { RARITY_ORDER } from "@/lib/rarity";

const POKEMON_POOL_SIZE = 151;
const PACK_SIZE = 5;

const RARITY_WEIGHTS: ReadonlyArray<readonly [string, number]> = [
  ["common", 60],
  ["uncommon", 25],
  ["rare", 12],
  ["event_rare", 3],
];

function pickRandomRarity(): string {
  const total = RARITY_WEIGHTS.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = Math.random() * total;
  for (const [rarity, weight] of RARITY_WEIGHTS) {
    roll -= weight;
    if (roll <= 0) return rarity;
  }
  return RARITY_WEIGHTS[0][0];
}

type PokemonApiResponse = {
  name: string;
  sprites: {
    front_default: string | null;
    other?: {
      "official-artwork"?: { front_default: string | null };
    };
  };
  types: { type: { name: string } }[];
};

async function fetchPokemonById(id: number) {
  try {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`, {
      next: { revalidate: 60 * 60 * 24 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as PokemonApiResponse;
    return {
      name: data.name,
      spriteUrl:
        data.sprites.other?.["official-artwork"]?.front_default ??
        data.sprites.front_default ??
        null,
      types: data.types.map((t) => t.type.name),
    };
  } catch {
    return null;
  }
}

function normalizePokemonName(name: string) {
  return name.trim().toLowerCase();
}

async function ensureCard(
  name: string,
  imageUrl: string | null,
  pokemonTypes: string[],
): Promise<number> {
  const slug = normalizePokemonName(name);
  const [card] = await db
    .insert(cards)
    .values({ name: slug, slug, imageUrl, pokemonTypes })
    .onConflictDoUpdate({
      target: cards.slug,
      set: { name: slug, imageUrl, pokemonTypes },
    })
    .returning({ id: cards.id });

  return card.id;
}

export async function generateRandomPack() {
  const access = await getCurrentUserAccess();
  if (access.status === "no_role") {
    throw new Error("Not authenticated");
  }

  const idSet = new Set<number>();
  while (idSet.size < PACK_SIZE) {
    idSet.add(Math.floor(Math.random() * POKEMON_POOL_SIZE) + 1);
  }
  const ids = [...idSet];

  const pokemons = await Promise.all(ids.map(fetchPokemonById));

  const packCards = await Promise.all(
    pokemons.map((p) => {
      if (!p) return Promise.resolve(null);
      return ensureCard(p.name, p.spriteUrl, p.types).then((cardId) => ({
        cardId,
        rarity: pickRandomRarity(),
      }));
    }),
  );

  const validPackCards = packCards.filter(
    (card): card is NonNullable<typeof card> => card !== null,
  );
  if (validPackCards.length !== PACK_SIZE) {
    throw new Error("Could not generate a full pack from PokeAPI");
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
    validPackCards.map(({ cardId, rarity }, idx) => ({
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
        rarity: userPackCards.rarity,
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
