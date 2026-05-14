import { getCurrentUserAccess } from "@/lib/access";
import { getUnopenedPacks, getUserCollectionGrouped } from "@/lib/collection";

import CollectionTabs, { type CollectionCardItem } from "./CollectionTabs";
import GeneratePackButton from "./GeneratePackButton";

export default async function CollectionMainContent() {
  const access = await getCurrentUserAccess();

  if (access.status === "no_role") {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-600 shadow-sm">
        Sign in to view your card collection and packs.
      </div>
    );
  }

  const [collection, unopenedPacks] = await Promise.all([
    getUserCollectionGrouped(access.userId),
    getUnopenedPacks(access.userId),
  ]);

  const enrichedCards: CollectionCardItem[] = collection.map((card) => ({
    cardId: card.cardId,
    name: card.name,
    displayName: card.name,
    rarity: card.rarity,
    imageUrl: card.imageUrl,
    count: card.count,
    eventTitle: card.eventTitle,
  }));

  const totalCardsHeld = collection.reduce((sum, c) => sum + c.count, 0);
  const eventSpecialCards = collection.reduce(
    (sum, c) => sum + (c.eventTitle ? c.count : 0),
    0,
  );

  return (
    <div className="flex h-full flex-col gap-4 sm:gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-gray-950 sm:text-2xl">
          My Collection
        </h1>
        <GeneratePackButton />
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <SummaryCard label="Packs Available" value={unopenedPacks.length} />
        <SummaryCard label="Event Special Cards" value={eventSpecialCards} />
        <SummaryCard label="Total Cards" value={totalCardsHeld} />
      </div>

      <CollectionTabs packs={unopenedPacks} cards={enrichedCards} />
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-2 shadow-sm sm:p-5">
      <p className="text-[0.65rem] leading-tight font-medium text-gray-500 sm:text-sm">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold text-gray-950 sm:mt-3 sm:text-3xl">
        {value}
      </p>
    </div>
  );
}
