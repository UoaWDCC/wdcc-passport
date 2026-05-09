import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";

import { cards, db, events, userCollection, userPacks } from "@/db";

export type CollectedCard = {
  collectionId: number;
  cardId: number;
  name: string;
  rarity: string;
  imageUrl: string | null;
  pokemonTypes: string[];
  obtainedAt: Date;
  eventTitle: string | null;
};

export type CollectedCardGroup = {
  cardId: number;
  name: string;
  rarity: string;
  imageUrl: string | null;
  pokemonTypes: string[];
  count: number;
  eventTitle: string | null;
};

export type UnopenedPack = {
  packId: number;
  eventId: number | null;
  eventTitle: string | null;
  grantedAt: Date;
  scanToken: string;
};

export async function getUserCollection(
  userId: number,
): Promise<CollectedCard[]> {
  const rows = await db
    .select({
      collectionId: userCollection.id,
      cardId: cards.id,
      name: cards.name,
      rarity: userCollection.rarity,
      imageUrl: cards.imageUrl,
      pokemonTypes: cards.pokemonTypes,
      obtainedAt: userCollection.obtainedAt,
      eventTitle: events.title,
    })
    .from(userCollection)
    .innerJoin(cards, eq(cards.id, userCollection.cardId))
    .leftJoin(events, eq(events.id, cards.eventId))
    .where(eq(userCollection.userId, userId))
    .orderBy(desc(userCollection.obtainedAt));

  return rows;
}

export async function getUserCollectionGrouped(
  userId: number,
): Promise<CollectedCardGroup[]> {
  const rows = await db
    .select({
      cardId: cards.id,
      name: cards.name,
      rarity: userCollection.rarity,
      imageUrl: cards.imageUrl,
      pokemonTypes: cards.pokemonTypes,
      count: sql<number>`count(*)::int`,
      eventTitle: events.title,
    })
    .from(userCollection)
    .innerJoin(cards, eq(cards.id, userCollection.cardId))
    .leftJoin(events, eq(events.id, cards.eventId))
    .where(eq(userCollection.userId, userId))
    .groupBy(
      cards.id,
      cards.name,
      userCollection.rarity,
      cards.imageUrl,
      cards.pokemonTypes,
      events.title,
    )
    .orderBy(desc(sql`max(${userCollection.obtainedAt})`));

  return rows;
}

export async function getUserCollectionCount(userId: number): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(userCollection)
    .where(eq(userCollection.userId, userId));

  return row?.count ?? 0;
}

export async function getUnopenedPacks(
  userId: number,
): Promise<UnopenedPack[]> {
  const rows = await db
    .select({
      packId: userPacks.id,
      eventId: userPacks.eventId,
      eventTitle: events.title,
      grantedAt: userPacks.grantedAt,
      scanToken: userPacks.scanToken,
    })
    .from(userPacks)
    .leftJoin(events, eq(events.id, userPacks.eventId))
    .where(and(eq(userPacks.userId, userId), isNull(userPacks.openedAt)))
    .orderBy(asc(userPacks.grantedAt));

  return rows;
}

export async function getUnopenedPackCount(userId: number): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(userPacks)
    .where(and(eq(userPacks.userId, userId), isNull(userPacks.openedAt)));

  return row?.count ?? 0;
}
