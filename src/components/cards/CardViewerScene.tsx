"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CardScene } from "@/cards/CardScene";
import { loadManifest } from "@/cards/manifest";
import type { SceneState, ViewMode } from "@/cards/types";

const MODES: Array<{ id: ViewMode; label: string }> = [
  { id: "fan", label: "FAN" },
  { id: "stack", label: "STACK" },
  { id: "single", label: "SINGLE" },
];

const HINTS: Record<ViewMode, string> = {
  fan: "Scroll, drag or ← → to browse · click a card to zoom",
  stack: "Swipe, scroll or ↑ ↓ to cycle the pile · tap the top card to flip",
  single: "Swipe, scroll or ← → for the next card · click to flip",
};

const btn = (active: boolean) =>
  `rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide transition sm:px-3 sm:text-xs ${
    active ? "bg-white text-black" : "text-white/70 hover:bg-white/10 hover:text-white"
  }`;

export default function CardViewerScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<CardScene | null>(null);
  const [state, setState] = useState<SceneState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let cancelled = false;
    let scene: CardScene | null = null;

    loadManifest()
      .then((entries) => {
        if (cancelled) return;
        if (entries.length === 0) {
          setError("manifest.json has no cards");
          return;
        }
        scene = new CardScene(container, entries, { onState: setState });
        sceneRef.current = scene;
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      });

    return () => {
      cancelled = true;
      scene?.dispose();
      sceneRef.current = null;
    };
  }, []);

  const s = sceneRef.current;

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#9fb0cc] text-white">
      <div ref={containerRef} className="absolute inset-0" />

      {/* Top bar (wraps on phones) */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-wrap items-center gap-2 p-2 sm:p-3">
        <div className="pointer-events-auto flex flex-wrap items-center gap-0.5 rounded-full bg-black/50 p-1 backdrop-blur">
          <Link href="/home" className={btn(false)}>
            ← Home
          </Link>
          <span className="mx-1 h-4 w-px bg-white/15" />
          {MODES.map((m) => (
            <button
              key={m.id}
              className={btn(state?.mode === m.id)}
              onClick={() => s?.setMode(m.id)}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Caption / hints */}
      <div className="pointer-events-none absolute inset-x-0 bottom-4 flex flex-col items-center gap-1 px-4 text-center text-[11px] text-white/80 sm:text-xs">
        {state?.focusedName && (
          <div className="text-sm font-semibold text-white">{state.focusedName}</div>
        )}
        {state?.inspecting ? (
          <div>
            Move the pointer to tilt · click the card to flip · Esc or click outside to return
          </div>
        ) : state ? (
          <div>{HINTS[state.mode]}</div>
        ) : null}
      </div>

      {error && (
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-red-300">
          Could not load cards: {error}
        </div>
      )}
    </div>
  );
}
