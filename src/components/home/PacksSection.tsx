"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SectionHeader } from "@/components/home/SectionHeader";
import { PackModal } from "@/components/packs/PackModal";
import { getUserPackCountQuery, openPackMutation } from "@/hooks/packs/query-options";

export function PacksSection() {
  const queryClient = useQueryClient();
  const { data: packCount = 0, error, isPending } = useQuery(getUserPackCountQuery());
  const [showPacks, setShowPacks] = useState(false);

  const {
    mutate: openPack,
    data: opened,
    error: openError,
  } = useMutation(
    openPackMutation({
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: ["get-user-pack-count"] });
        void queryClient.invalidateQueries({ queryKey: ["get-user-cards"] });
      },
    }),
  );

  return (
    <section>
      <SectionHeader title="Packs" count={isPending || error ? undefined : packCount} />

      <div className="flex flex-col items-start gap-4">
        <button
          type="button"
          onClick={() => setShowPacks(true)}
          disabled={packCount === 0}
          className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black transition hover:bg-white/90 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40"
        >
          Packs
        </button>

        {error && (
          <p className="rounded-lg bg-red-100 px-4 py-3 text-sm font-semibold text-red-700">
            Could not load packs.
          </p>
        )}

        {/* prob change this to a hover or smth later */}
        {!error && packCount === 0 && (
          <p className="text-sm text-white/60">
            No packs yet — scan a QR code at a WDCC event to earn one.
          </p>
        )}

        {openError && (
          <p role="alert" className="text-sm font-semibold text-red-300">
            Could not open the pack. Please try again.
          </p>
        )}

        {opened && (
          <ul aria-label="Cards from the pack" className="flex flex-col gap-1">
            {opened.map((card, i) => (
              <li key={`${card.id}-${i}`} className="text-sm text-white/70">
                <span className="font-semibold text-white">{card.name}</span> ·{" "}
                <span className="capitalize">{card.rarity}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showPacks && (
        <PackModal
          packCount={packCount}
          onOpen={() => openPack()}
          onClose={() => setShowPacks(false)}
        />
      )}
    </section>
  );
}
