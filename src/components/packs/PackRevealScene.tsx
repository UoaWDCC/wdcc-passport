"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { CardScene, type CardStatus } from "@/cards/CardScene";
import type { CardEntry } from "@/cards/types";

const HINT = "Swipe for the next card · tap to flip";

export default function PackRevealScene({
  cards,
  onClose,
}: {
  cards: CardEntry[];
  onClose: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<CardScene | null>(null);
  const [index, setIndex] = useState(0);
  // Read through a ref so a new onClose from the parent doesn't rebuild the scene.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);
  const [status, setStatus] = useState<CardStatus>({ kind: "loading" });
  /** Bumped for each legendary reveal, so the flash overlay remounts and replays. */
  const [flash, setFlash] = useState(0);
  /** Highest card index that has had its reveal; a charging legendary's name stays hidden. */
  const [revealedUpTo, setRevealedUpTo] = useState(-1);
  const [effectsUnavailable, setEffectsUnavailable] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let scene: CardScene | null = null;
    try {
      scene = new CardScene(
        container,
        {
          onStatus: setStatus,
          onStep: () => {},
          onFocus: setIndex,
          onInspect: () => {},
          onEffectsUnavailable: () => setEffectsUnavailable(true),
          onEmpty: () => onCloseRef.current(),
          onReveal: (i) => {
            setRevealedUpTo((n) => Math.max(n, i));
            if (cards[i]?.rarity !== "legendary") return;
            setFlash((n) => n + 1);
            navigator.vibrate?.([40, 60, 120]);
          },
        },
        { room: false },
      );
      // Each swiped card leaves the pile for good, so only these cards are ever shown.
      scene.showStack(cards, 0, { once: true, reveal: true });
      sceneRef.current = scene;
    } catch {
      // Reported on the next tick, like the scene's own async callbacks.
      queueMicrotask(() =>
        setStatus({
          kind: "error",
          message: "WebGL is not available in this browser, so the 3D view cannot start.",
        }),
      );
    }

    return () => {
      scene?.dispose();
      sceneRef.current = null;
    };
  }, [cards]);

  const current = cards[index];

  return (
    <div className="absolute inset-0 overflow-hidden text-white">
      <div ref={containerRef} className="absolute inset-0" />

      {flash > 0 && (
        <div
          key={flash}
          aria-hidden
          className="animate-flash pointer-events-none absolute inset-0 bg-white motion-reduce:hidden"
        />
      )}

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-end p-3">
        <button
          type="button"
          onClick={onClose}
          className="pointer-events-auto rounded-full bg-black/50 px-4 py-1.5 text-xs font-semibold text-white/80 backdrop-blur transition hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
        >
          Skip
        </button>
      </div>

      <div
        aria-live="polite"
        className="pointer-events-none absolute inset-x-0 bottom-4 flex flex-col items-center gap-2 px-4 text-center text-xs text-white/80"
      >
        <div className="text-sm font-semibold text-white">
          {current
            ? `${index <= revealedUpTo ? `${current.name} · ${current.rarity}` : "???"} · ${index + 1} / ${cards.length}`
            : ""}
        </div>
        <button
          type="button"
          onClick={() =>
            index + 1 < cards.length ? sceneRef.current?.showStack(cards, index + 1) : onClose()
          }
          className="pointer-events-auto rounded-full bg-black/50 px-3 py-1 text-xs font-semibold text-white/80 backdrop-blur transition hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
        >
          {index + 1 < cards.length ? "Next ›" : "Done"}
        </button>
        {status.kind === "ready" && <div>{HINT}</div>}
        {effectsUnavailable && (
          <div className="text-amber-200">
            Holographic effects are not available on this device, so cards are shown plain.
          </div>
        )}
      </div>

      {status.kind === "error" && (
        <div
          role="alert"
          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center"
        >
          <p className="text-sm text-red-300">Could not show the 3D card: {status.message}</p>
          {current && (
            <Image
              src={current.front}
              alt={current.name}
              width={496}
              height={700}
              className="h-auto w-full max-w-xs rounded-xl"
            />
          )}
        </div>
      )}
    </div>
  );
}
