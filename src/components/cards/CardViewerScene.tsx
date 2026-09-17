"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { CardScene, type CardStatus } from "@/cards/CardScene";
import { detectMobile } from "@/cards/three/layout";
import type { ViewMode } from "@/cards/types";
import { getUserCardsQuery } from "@/hooks/cards/query-options";
import { useQuery } from "@tanstack/react-query";

const MODES: Array<{ id: ViewMode; label: string }> = [
  { id: "fan", label: "Fan" },
  { id: "stack", label: "Stack" },
  { id: "single", label: "Single" },
];

const HINTS: Record<ViewMode, string> = {
  fan: "Drag to browse · tap a card to inspect",
  stack: "Swipe to cycle · tap the top card to flip",
  single: "Swipe to browse · tap to flip",
};
const INSPECT_HINT = "Tap to flip · tap outside to return";

export default function CardViewerScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<CardScene | null>(null);
  const [index, setIndex] = useState(0);
  // pokebox: default is stack on mobile, fan on desktop
  const [mode, setMode] = useState<ViewMode>(() => (detectMobile() ? "stack" : "fan"));
  const [inspecting, setInspecting] = useState(false);
  const [status, setStatus] = useState<CardStatus>({ kind: "loading" });
  const [effectsUnavailable, setEffectsUnavailable] = useState(false);

  const { data: cards, error, isPending } = useQuery(getUserCardsQuery());

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !cards || cards.length === 0) return;

    let scene: CardScene | null = null;
    try {
      scene = new CardScene(container, {
        onStatus: setStatus,
        onStep: (delta) => setIndex((i) => (i + delta + cards.length) % cards.length),
        onFocus: setIndex,
        onInspect: setInspecting,
        onEffectsUnavailable: () => setEffectsUnavailable(true),
      });
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

  const current = cards?.[index];

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || !cards || cards.length === 0) return;
    if (mode === "fan") {
      scene.showFan(cards, index);
      return;
    }
    if (mode === "stack") {
      scene.showStack(cards, index);
      return;
    }
    // Keep the neighbours' textures loaded so the next swipe is instant.
    scene.showSingle(cards[index], [
      cards[(index - 1 + cards.length) % cards.length],
      cards[(index + 1) % cards.length],
    ]);
  }, [cards, index, mode]);

  const switchMode = (next: ViewMode) => {
    setMode(next);
    setInspecting(false);
  };

  const overlay =
    "pointer-events-none absolute inset-0 flex items-center justify-center p-6 text-center";
  const pill =
    "pointer-events-auto rounded-full bg-black/50 px-3 py-2 text-[10px] text-white/80 backdrop-blur transition hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none disabled:opacity-40";

  return (
    <div className="flex h-full w-full flex-col gap-3 py-3 text-white [text-shadow:2px_2px_0_#000]">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {cards &&
            cards.length > 0 &&
            MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                aria-pressed={mode === m.id}
                onClick={() => switchMode(m.id)}
                className={`${pill} ${mode === m.id ? "bg-white/30 text-white ring-2 ring-white/80" : ""}`}
              >
                {m.label}
              </button>
            ))}
        </div>
        {cards && cards.length > 0 && (
          <span className="text-xs tabular-nums" aria-live="polite">
            {index + 1} / {cards.length}
          </span>
        )}
      </div>

      <div className="relative min-h-0 flex-1">
        <div ref={containerRef} className="absolute inset-0" />

        {isPending && (
          <div role="status" className={`${overlay} text-xs`}>
            Loading cards…
          </div>
        )}
        {error && (
          <div role="alert" className={`${overlay} text-xs text-red-300`}>
            Could not load your cards.
          </div>
        )}
        {status.kind === "loading" && mode === "single" && cards && cards.length > 0 && (
          <div role="status" className={`${overlay} text-xs`}>
            Loading card…
          </div>
        )}
        {cards?.length === 0 && (
          <div role="status" className={`${overlay} text-xs`}>
            No cards to show yet.
          </div>
        )}
        {status.kind === "error" && (
          <div role="alert" className={`${overlay} flex-col gap-4`}>
            <p className="text-xs text-red-300">Could not show the 3D card: {status.message}</p>
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

      <div aria-live="polite" className="flex flex-col items-center gap-2 text-center">
        <div className="flex items-center justify-center gap-3">
          {cards && cards.length > 1 && (
            <button
              type="button"
              onClick={() => setIndex((i) => (i - 1 + cards.length) % cards.length)}
              disabled={inspecting}
              aria-label="Previous card"
              className={`${pill} px-3`}
            >
              ‹
            </button>
          )}
          <div className="text-xs">{current ? current.name : ""}</div>
          {cards && cards.length > 1 && (
            <button
              type="button"
              onClick={() => setIndex((i) => (i + 1) % cards.length)}
              disabled={inspecting}
              aria-label="Next card"
              className={`${pill} px-3`}
            >
              ›
            </button>
          )}
        </div>
        <div className="text-[10px] text-white/80 capitalize">
          {current ? `${current.rarity} · ×${current.quantity}` : ""}
        </div>
        <div className="text-[10px] text-white/70">
          {status.kind === "ready" ? (inspecting ? INSPECT_HINT : HINTS[mode]) : ""}
        </div>
        {effectsUnavailable && (
          <div className="text-[10px] text-amber-200">Holo effects unavailable on this device.</div>
        )}
      </div>
    </div>
  );
}
