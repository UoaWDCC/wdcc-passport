"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CardScene, type CardStatus } from "@/cards/CardScene";
import { loadManifest } from "@/cards/manifest";
import type { CardEntry, ViewMode } from "@/cards/types";

// for now until we actually create server action
const MANIFEST_URL = "/cards/manifest.json";

export default function CardViewerScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<CardScene | null>(null);
  const [cards, setCards] = useState<CardEntry[] | null>(null);
  const [index, setIndex] = useState(0);
  const [mode, setMode] = useState<ViewMode>("single");
  const [inspecting, setInspecting] = useState(false);
  const [status, setStatus] = useState<CardStatus>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    loadManifest(MANIFEST_URL)
      .then((loaded) => {
        if (!cancelled) setCards(loaded);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setStatus({ kind: "error", message: err instanceof Error ? err.message : String(err) });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

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

  return (
    <div className="fixed inset-0 overflow-hidden bg-gray-900 text-white">
      <div ref={containerRef} className="absolute inset-0" />

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center gap-2 p-3">
        <Link
          href="/home"
          className="pointer-events-auto rounded-full bg-black/50 px-3 py-1 text-xs font-semibold text-white/80 backdrop-blur transition hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
        >
          ← Home
        </Link>
        {cards &&
          cards.length > 0 &&
          (["single", "fan"] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => switchMode(m)}
              className={`pointer-events-auto rounded-full px-3 py-1 text-xs font-semibold backdrop-blur transition focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none ${
                mode === m
                  ? "bg-white text-black"
                  : "bg-black/50 text-white/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              {m === "single" ? "Single" : "Fan"}
            </button>
          ))}
      </div>

      <div
        aria-live="polite"
        className="pointer-events-none absolute inset-x-0 bottom-4 flex flex-col items-center gap-1 px-4 text-center text-xs text-white/80"
      >
        <div className="text-sm font-semibold text-white">
          {current && cards ? `${current.name} · ${index + 1} / ${cards.length}` : ""}
        </div>
        {cards && cards.length > 1 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIndex((i) => (i - 1 + cards.length) % cards.length)}
              disabled={inspecting}
              className="pointer-events-auto rounded-full bg-black/50 px-3 py-1 text-xs font-semibold text-white/80 backdrop-blur transition hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none disabled:opacity-40"
            >
              ‹ Prev
            </button>
            <button
              type="button"
              onClick={() => setIndex((i) => (i + 1) % cards.length)}
              disabled={inspecting}
              className="pointer-events-auto rounded-full bg-black/50 px-3 py-1 text-xs font-semibold text-white/80 backdrop-blur transition hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none disabled:opacity-40"
            >
              Next ›
            </button>
          </div>
        )}
        {status.kind === "ready" && (
          <div>
            {mode === "fan"
              ? inspecting
                ? "move the pointer to tilt · click or press Enter to flip · Esc or click outside to return"
                : "drag, scroll or ← → to browse · click a card or press Enter to inspect"
              : "move the pointer to tilt · click or press Enter to flip · swipe or ← → to browse"}
          </div>
        )}
      </div>

      {status.kind === "loading" && mode === "single" && cards?.length !== 0 && (
        <div
          role="status"
          className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-white/60"
        >
          Loading card…
        </div>
      )}

      {cards?.length === 0 && (
        <div
          role="status"
          className="absolute inset-0 flex items-center justify-center text-sm text-white/60"
        >
          No cards to show yet.
        </div>
      )}

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
