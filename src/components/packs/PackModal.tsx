"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { CardEntry } from "@/cards/types";
import { PackReveal } from "@/components/packs/PackReveal";
import { PackTear } from "@/components/packs/PackTear";
import { pixelButton } from "@/components/ui/pixel";

/** Stand-in pack art: the card back, until the real pack design arrives. */
const PACK_IMAGE = "/packs/pack-front.webp";

type Phase = "choose" | "tear" | "reveal";

export function PackModal({
  packCount,
  opened,
  openError,
  onOpen,
  onClose,
}: {
  packCount: number;
  /** The cards from the pack, once the server has drawn them. */
  opened: CardEntry[] | undefined;
  openError: boolean;
  onOpen: () => void;
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("choose");
  /** The pack has been torn (and consumed server-side), so the modal can no longer be dismissed. */
  const [opening, setOpening] = useState(false);
  /** The reveal is over: fade the whole overlay out, then close for real. */
  const [closing, setClosing] = useState(false);
  /** The pack was just torn: a flash and a shake sell the rip. */
  const [torn, setTorn] = useState(false);

  function finish() {
    // No transition runs under reduced motion, so onTransitionEnd never would either.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onClose();
      return;
    }
    setClosing(true);
  }

  useEffect(() => {
    if (opening) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [opening, onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Your packs"
      onTransitionEnd={(e) => {
        if (closing && e.target === e.currentTarget) onClose();
      }}
      className={`fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-black/85 backdrop-blur-md transition-opacity duration-500 ease-out motion-reduce:transition-none ${
        closing ? "pointer-events-none opacity-0" : ""
      }`}
    >
      {!opening && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className={`fixed top-3 right-3 z-10 ${pixelButton({ size: "icon" })}`}
        >
          X
        </button>
      )}

      {torn && (
        <div
          aria-hidden
          className="animate-flash pointer-events-none fixed inset-0 z-20 bg-white motion-reduce:hidden"
        />
      )}

      {phase === "reveal" && opened ? (
        <PackReveal cards={opened} onClose={finish} />
      ) : (
        <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
          {phase === "choose" && (
            <div className="flex max-w-5xl flex-wrap items-center justify-center gap-4 sm:gap-6">
              {Array.from({ length: packCount }).map((_, index) => (
                <button
                  key={index}
                  type="button"
                  aria-label={`Open pack ${index + 1}`}
                  onClick={() => setPhase("tear")}
                  className="w-40 shrink-0 transition duration-200 hover:scale-105 hover:drop-shadow-[0_0_16px_#4da3ff] focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none sm:w-52 md:w-60"
                >
                  <Image
                    src={PACK_IMAGE}
                    alt=""
                    width={500}
                    height={700}
                    className="h-auto w-full rounded-xl"
                  />
                </button>
              ))}
            </div>
          )}

          {phase === "tear" && (
            <div className={torn ? "animate-shake motion-reduce:animate-none" : ""}>
              <PackTear
                image={PACK_IMAGE}
                onTear={() => {
                  setOpening(true);
                  setTorn(true);
                  onOpen();
                }}
                onDone={() => setPhase("reveal")}
              />
            </div>
          )}

          {/* The pack is open but the cards are still on their way, or never arrived. */}
          {phase === "reveal" &&
            (openError ? (
              <div className="flex flex-col items-center gap-4 text-center">
                <p role="alert" className="text-sm font-semibold text-red-300">
                  Could not open the pack. Please try again.
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black transition hover:bg-white/90 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
                >
                  Close
                </button>
              </div>
            ) : (
              <p role="status" className="text-sm text-white/60">
                Opening pack…
              </p>
            ))}
        </div>
      )}
    </div>
  );
}
