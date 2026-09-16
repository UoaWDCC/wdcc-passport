"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { PackTear } from "@/components/packs/PackTear";

/** Stand-in pack art: the card back, until the real pack design arrives. */
const PACK_IMAGE = "/packs/pack-front.webp";

export function PackModal({
  packCount,
  onOpen,
  onClose,
}: {
  packCount: number;
  onOpen: () => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState(false);
  /** The pack has been torn (and consumed server-side), so the modal can no longer be dismissed. */
  const [opening, setOpening] = useState(false);

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
      className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-black/85 backdrop-blur-md"
    >
      {!opening && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="fixed top-3 right-3 z-10 flex size-11 items-center justify-center rounded-full text-3xl leading-none text-white/60 transition hover:scale-110 hover:text-white focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
        >
          ×
        </button>
      )}

      <div
        onClick={(e) => {
          if (!opening && e.target === e.currentTarget) onClose();
        }}
        className="flex min-h-full items-center justify-center p-4 sm:p-6"
      >
        {selected ? (
          <PackTear
            image={PACK_IMAGE}
            onTear={() => {
              setOpening(true);
              onOpen();
            }}
            onDone={onClose}
          />
        ) : (
          <div className="flex max-w-5xl flex-wrap items-center justify-center gap-4 sm:gap-6">
            {Array.from({ length: packCount }).map((_, index) => (
              <button
                key={index}
                type="button"
                aria-label={`Open pack ${index + 1}`}
                onClick={() => setSelected(true)}
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
      </div>
    </div>
  );
}
