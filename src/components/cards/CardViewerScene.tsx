"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CardScene } from "@/cards/CardScene";
import type { CardImages } from "@/cards/types";

/** Development-only demo card. Replaced by manifest data in a later PR. */
const DEMO_CARD: CardImages & { name: string; width: number; height: number } = {
  name: "Pikachoo",
  front: "/cards/pikachoo.webp",
  back: "/cards/backside.webp",
  width: 496,
  height: 700,
};

//replace with tanstack later
type Status = { kind: "loading" } | { kind: "ready" } | { kind: "error"; message: string };

export default function CardViewerScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>({ kind: "loading" });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let scene: CardScene | null = null;
    try {
      //change CardScene later to allow for a list of cards to be passed in
      scene = new CardScene(container, DEMO_CARD, {
        onReady: () => setStatus({ kind: "ready" }),
        onError: (message) => setStatus({ kind: "error", message }),
      });
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
    };
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden bg-gray-900 text-white">
      <div ref={containerRef} className="absolute inset-0" />

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center p-3">
        <Link
          href="/home"
          className="pointer-events-auto rounded-full bg-black/50 px-3 py-1 text-xs font-semibold text-white/80 backdrop-blur transition hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
        >
          ← Home
        </Link>
      </div>

      <div
        aria-live="polite"
        className="pointer-events-none absolute inset-x-0 bottom-4 flex flex-col items-center gap-1 px-4 text-center text-xs text-white/80"
      >
        <div className="text-sm font-semibold text-white">{DEMO_CARD.name}</div>
        {status.kind === "ready" && (
          <div>move the pointer to tilt · click or press Enter to flip</div>
        )}
      </div>

      {status.kind === "loading" && (
        <div
          role="status"
          className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-white/60"
        >
          Loading card…
        </div>
      )}

      {status.kind === "error" && (
        <div
          role="alert"
          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center"
        >
          <p className="text-sm text-red-300">Could not show the 3D card: {status.message}</p>
          <Image
            src={DEMO_CARD.front}
            alt={DEMO_CARD.name}
            width={DEMO_CARD.width}
            height={DEMO_CARD.height}
            className="h-auto w-full max-w-xs rounded-xl"
          />
        </div>
      )}
    </div>
  );
}
