"use client";

import { type CSSProperties, useState, useTransition } from "react";

import { useRouter } from "next/navigation";

import { openPack, type RevealedCard } from "@/app/user/collection/actions";
import { RARITY_BACKDROP_STYLES } from "@/lib/rarity";

import { CollectionCardDisplay } from "./CardDisplay";
import InteractiveCardDisplay from "./InteractiveCardDisplay";

const dateFormatter = new Intl.DateTimeFormat("en-NZ", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const rarityAnimationColor: Record<string, string> = {
  common: "#f8fafc",
  uncommon: "#4ade80",
  rare: "#60a5fa",
  event_rare: "#fbbf24",
};

export type PackOpenerProps = {
  packId: number;
  eventTitle: string | null;
  grantedAt: Date | string;
};

export default function PackOpener({
  packId,
  eventTitle,
  grantedAt,
}: PackOpenerProps) {
  const router = useRouter();
  const [revealed, setRevealed] = useState<RevealedCard[] | null>(null);
  const [index, setIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleOpen = () => {
    setError(null);
    startTransition(async () => {
      try {
        const result = await openPack(packId);
        setRevealed(result);
        setIndex(0);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to open pack");
      }
    });
  };

  const handleAdvance = () => {
    if (!revealed) return;
    if (index >= revealed.length - 1) {
      setRevealed(null);
      setIndex(0);
      router.refresh();
    } else {
      setIndex((i) => i + 1);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        disabled={isPending}
        className="flex w-full flex-col gap-2 rounded-lg border border-dashed border-gray-300 bg-white p-4 text-left shadow-sm transition hover:border-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[0.65rem] font-semibold text-amber-800">
            SEALED
          </span>
          <span className="text-xs text-gray-400">
            {dateFormatter.format(new Date(grantedAt))}
          </span>
        </div>
        <p className="text-sm font-semibold text-gray-950">
          {eventTitle ?? "Random pack"}
        </p>
        <p className="text-xs text-gray-500">
          {isPending ? "Opening..." : "Tap to open"}
        </p>
        {error ? <p className="text-xs text-red-600">{error}</p> : null}
      </button>

      {revealed && revealed.length > 0 ? (
        <RevealOverlay
          card={revealed[index]}
          index={index}
          total={revealed.length}
          onAdvance={handleAdvance}
        />
      ) : null}
    </>
  );
}

function RevealOverlay({
  card,
  index,
  total,
  onAdvance,
}: {
  card: RevealedCard;
  index: number;
  total: number;
  onAdvance: () => void;
}) {
  const isLast = index === total - 1;
  const backdrop = RARITY_BACKDROP_STYLES[card.rarity] ?? "bg-gray-300";
  const rarityColor = rarityAnimationColor[card.rarity] ?? "#f8fafc";

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{ "--pack-rarity-color": rarityColor } as CSSProperties}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-between overflow-hidden p-4 transition-colors sm:p-6 ${backdrop}`}
    >
      <div
        key={`wash-${card.cardId}-${index}`}
        aria-hidden
        className="pack-rarity-wash pointer-events-none fixed inset-0"
      />
      <div
        key={`burst-${card.cardId}-${index}`}
        aria-hidden
        className="pack-rarity-burst pointer-events-none fixed top-1/2 left-1/2 h-40 w-40 rounded-full mix-blend-screen sm:h-56 sm:w-56"
      />

      <div className="z-10 flex w-full max-w-xl items-center justify-start text-sm font-semibold text-gray-900/80">
        <span>
          Card {index + 1} of {total}
        </span>
      </div>

      <div className="min-h-0 w-full flex-1">
        {card.imageUrl ? (
          <InteractiveCardDisplay
            key={`${card.cardId}-${index}`}
            imageUrl={card.imageUrl}
            className="pack-card-reveal mx-auto h-full min-h-[420px] w-full max-w-4xl"
          />
        ) : (
          <CollectionCardDisplay
            key={`${card.cardId}-${index}`}
            card={{
              cardId: card.cardId,
              displayName: card.name,
              rarity: card.rarity,
              imageUrl: card.imageUrl,
            }}
            className="pack-card-reveal mx-auto mt-8 w-full max-w-sm"
          />
        )}
      </div>

      <div className="z-10 flex w-full max-w-xl items-center justify-end">
        <button
          type="button"
          onClick={onAdvance}
          className="shrink-0 rounded-full bg-gray-950 px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-gray-800"
        >
          {isLast ? "Finish" : "Next card"}
        </button>
      </div>
    </div>
  );
}
