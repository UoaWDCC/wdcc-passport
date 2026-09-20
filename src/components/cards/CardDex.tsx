"use client";

import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

import type { CardRarity } from "@/cards/types";
import { getUserCardsQuery } from "@/hooks/cards/query-options";

const PANEL = "border-4 border-black bg-white text-black shadow-[4px_4px_0_#000]";

/** Section order. */
const RARITIES: Array<{ id: CardRarity; label: string }> = [
  { id: "common", label: "Common" },
  { id: "rare", label: "Rare" },
  { id: "epic", label: "Epic" },
  { id: "legendary", label: "Legendary" },
];

/**
 * Every card in the set as a plain image grid. Owned cards show how many the user has and
 * open in the 3D viewer; the rest are blacked out until collected.
 */
export function CardDex({
  onOpen,
  onCount,
}: {
  onOpen: (id: string) => void;
  onCount: (text: string) => void;
}) {
  const { data: cards = [], error, isPending } = useQuery(getUserCardsQuery());
  const owned = cards.filter((c) => c.quantity > 0).length;

  const countText = isPending || error ? "" : `${owned} / ${cards.length}`;
  useEffect(() => onCount(countText), [onCount, countText]);

  return (
    <div className="flex flex-col gap-6">
      {isPending && (
        <ul className="grid grid-cols-3 gap-3" aria-label="Loading cards">
          {Array.from({ length: 9 }).map((_, i) => (
            <li key={i} className="aspect-[63/88] animate-pulse rounded-lg bg-white/20" />
          ))}
        </ul>
      )}

      {error && (
        <p
          className={`px-4 py-3 text-[10px] leading-relaxed text-red-700 [text-shadow:none] ${PANEL}`}
        >
          Could not load your cards.
        </p>
      )}

      {!isPending && !error && cards.length === 0 && (
        <p className={`px-4 py-3 text-[10px] leading-relaxed [text-shadow:none] ${PANEL}`}>
          No cards have been created yet.
        </p>
      )}

      {RARITIES.map((rarity) => {
        const group = cards.filter((c) => c.rarity === rarity.id);
        if (group.length === 0) return null;
        return (
          <section key={rarity.id} className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xs">{rarity.label}</h2>
              <p className="text-[10px]">
                {group.filter((c) => c.quantity > 0).length} / {group.length}
              </p>
            </div>
            <ul className="grid grid-cols-3 gap-3">
              {group.map((card) => {
                const has = card.quantity > 0;
                const art = (
                  <span className="relative block aspect-[63/88] overflow-hidden rounded-lg">
                    <Image
                      src={card.front}
                      alt=""
                      fill
                      // Ask for well over the tile's size, at high quality: card art is full
                      // of small print that a tight, default-quality thumbnail smears.
                      sizes="(max-width: 430px) 50vw, 220px"
                      quality={90}
                      // A missing card is its own silhouette: the art blacked out.
                      className={`object-cover ${has ? "" : "opacity-80 brightness-0"}`}
                    />
                    {has && (
                      <span className="absolute right-1 bottom-1 rounded bg-black/75 px-1.5 py-1 text-[10px] leading-none [text-shadow:none]">
                        ×{card.quantity}
                      </span>
                    )}
                  </span>
                );
                return (
                  <li key={card.id} className="flex flex-col gap-2">
                    {has ? (
                      <button
                        type="button"
                        onClick={() => onOpen(card.id)}
                        aria-label={`${card.name}, ${card.rarity}, ${card.quantity} owned`}
                        className="block w-full transition active:scale-95"
                      >
                        {art}
                      </button>
                    ) : (
                      <div aria-label="Card not collected yet" className="ring-1 ring-white/20">
                        {art}
                      </div>
                    )}
                    <span className="truncate text-center text-[8px] leading-relaxed">
                      {has ? card.name : "???"}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
