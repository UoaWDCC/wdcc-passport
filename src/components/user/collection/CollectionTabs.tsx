"use client";

import { useState } from "react";

import { RARITY_ORDER } from "@/lib/rarity";
import type { UnopenedPack } from "@/lib/collection";

import {
  CollectionCardDisplay,
  type CollectionCardDisplayData,
} from "./CardDisplay";
import PackOpener from "./PackOpener";

export type CollectionCardItem = CollectionCardDisplayData & {
  name: string;
};

type Tab = "packs" | "cards";
type SortBy = "alphabetical" | "rarity";
type SortDirection = "asc" | "desc";

export default function CollectionTabs({
  packs,
  cards,
}: {
  packs: UnopenedPack[];
  cards: CollectionCardItem[];
}) {
  const [tab, setTab] = useState<Tab>("packs");

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <TabSlider
        tab={tab}
        onChange={setTab}
        packCount={packs.length}
        cardCount={cards.length}
      />
      {tab === "packs" ? (
        <PacksPanel packs={packs} />
      ) : (
        <CardsPanel cards={cards} />
      )}
    </div>
  );
}

function TabSlider({
  tab,
  onChange,
  packCount,
  cardCount,
}: {
  tab: Tab;
  onChange: (tab: Tab) => void;
  packCount: number;
  cardCount: number;
}) {
  return (
    <div className="relative grid grid-cols-2 rounded-full border border-gray-200 bg-gray-100 p-1 text-sm font-medium">
      <span
        aria-hidden
        className={`absolute top-1 bottom-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-white shadow transition-transform duration-200 ease-out ${
          tab === "cards" ? "translate-x-full" : "translate-x-0"
        }`}
      />
      <button
        type="button"
        onClick={() => onChange("packs")}
        className={`relative z-10 rounded-full px-4 py-2 transition-colors ${
          tab === "packs" ? "text-gray-950" : "text-gray-500"
        }`}
      >
        Packs ({packCount})
      </button>
      <button
        type="button"
        onClick={() => onChange("cards")}
        className={`relative z-10 rounded-full px-4 py-2 transition-colors ${
          tab === "cards" ? "text-gray-950" : "text-gray-500"
        }`}
      >
        Cards ({cardCount})
      </button>
    </div>
  );
}

function PacksPanel({ packs }: { packs: UnopenedPack[] }) {
  if (packs.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-500 shadow-sm">
        No sealed packs right now. Attend an event to earn one.
      </div>
    );
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {packs.map((pack) => (
        <li key={pack.packId}>
          <PackOpener
            packId={pack.packId}
            eventTitle={pack.eventTitle}
            grantedAt={pack.grantedAt}
          />
        </li>
      ))}
    </ul>
  );
}

function CardsPanel({ cards }: { cards: CollectionCardItem[] }) {
  const [sortBy, setSortBy] = useState<SortBy>("alphabetical");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  if (cards.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-500 shadow-sm">
        You haven&apos;t collected any cards yet. Open a pack to get started.
      </div>
    );
  }

  const sortedCards = [...cards].sort((a, b) => {
    const multiplier = sortDirection === "asc" ? 1 : -1;

    if (sortBy === "rarity") {
      const rarityA = RARITY_ORDER[a.rarity] ?? 99;
      const rarityB = RARITY_ORDER[b.rarity] ?? 99;
      if (rarityA !== rarityB) return (rarityA - rarityB) * multiplier;
    }

    return (
      a.displayName.localeCompare(b.displayName, undefined, {
        sensitivity: "base",
      }) * multiplier
    );
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-xs font-medium text-gray-600">
          Sort by
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as SortBy)}
            className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-semibold text-gray-900 shadow-sm"
          >
            <option value="alphabetical">Alphabetical</option>
            <option value="rarity">Rarity</option>
          </select>
        </label>

        <div className="grid grid-cols-2 rounded-full border border-gray-200 bg-gray-100 p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setSortDirection("asc")}
            className={`rounded-full px-3 py-1 transition-colors ${
              sortDirection === "asc"
                ? "bg-white text-gray-950 shadow"
                : "text-gray-500"
            }`}
          >
            Asc
          </button>
          <button
            type="button"
            onClick={() => setSortDirection("desc")}
            className={`rounded-full px-3 py-1 transition-colors ${
              sortDirection === "desc"
                ? "bg-white text-gray-950 shadow"
                : "text-gray-500"
            }`}
          >
            Desc
          </button>
        </div>
      </div>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {sortedCards.map((card) => (
          <li key={card.cardId}>
            <CollectionCardDisplay card={card} />
          </li>
        ))}
      </ul>
    </div>
  );
}
