"use client";

import { useState, useTransition } from "react";

import { useRouter } from "next/navigation";

import { openPack, type RevealedCard } from "@/app/user/collection/actions";
import {
  RARITY_BACKDROP_STYLES,
  RARITY_BORDER_STYLES,
  RARITY_LABEL,
} from "@/lib/rarity";

const dateFormatter = new Intl.DateTimeFormat("en-NZ", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

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
  const border = RARITY_BORDER_STYLES[card.rarity] ?? "border-gray-500";

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onAdvance}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 p-4 transition-colors ${backdrop}`}
    >
      <p className="text-sm font-semibold text-gray-900/80">
        Card {index + 1} of {total}
      </p>

      <div
        className={`flex w-full max-w-xs flex-col gap-3 rounded-xl border-4 bg-white p-4 shadow-2xl ${border}`}
      >
        <div className="aspect-square w-full overflow-hidden rounded-lg bg-gray-50">
          {card.imageUrl ? (
            <img
              src={card.imageUrl}
              alt={card.name}
              className="h-full w-full object-contain p-2"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
              No image
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-lg font-bold text-gray-950 capitalize">
            {card.name}
          </p>
          <p className="text-xs font-semibold tracking-wide text-gray-700 uppercase">
            {RARITY_LABEL[card.rarity] ?? card.rarity}
          </p>
        </div>
      </div>

      <p className="text-sm font-semibold text-gray-900">
        {isLast ? "Click to finish" : "Click to continue"}
      </p>
    </div>
  );
}
